// @ts-check
/// <reference types="@super-productivity/plugin-api/global" />

(function () {
  'use strict';

  const DEFAULT_CONFIG = {
    focusOnWorkEnd: true,
    focusOnBreakEnd: false,
    enableOneMinuteWarning: true,
    warningSeconds: 60,
    warningType: 'notify',
    warningTitle: 'Pomodoro: Noch 1 Minute',
    warningMessage: 'Deine aktuelle Pomodoro-Session endet in 1 Minute.',
  };

  const DEFAULT_WORK_DURATION_MS = 25 * 60 * 1000;
  const DEFAULT_BREAK_DURATION_MS = 5 * 60 * 1000;

  let config = { ...DEFAULT_CONFIG };
  let unloaded = false;

  const session = {
    purpose: /** @type {'work' | 'break' | null} */ (null),
    duration: 0,
    elapsed: 0,
    startedAt: 0,
    isPaused: false,
    warningFired: false,
    endHandled: false,
  };

  function resetSession() {
    session.purpose = null;
    session.duration = 0;
    session.elapsed = 0;
    session.startedAt = 0;
    session.isPaused = false;
    session.warningFired = false;
    session.endHandled = false;
  }

  async function loadConfig() {
    if (unloaded) return;
    try {
      const saved = await PluginAPI.getConfig();
      if (saved && typeof saved === 'object') {
        config = {
          ...DEFAULT_CONFIG,
          ...saved,
        };
      } else {
        config = { ...DEFAULT_CONFIG };
      }
    } catch (err) {
      PluginAPI.log?.warn?.('[pomodoro-focus-notifier] Failed to load config:', err);
    }
  }

  function getWarningMs() {
    const secs = Number(config.warningSeconds);
    if (!Number.isFinite(secs) || secs <= 0) {
      return 60 * 1000;
    }
    return secs * 1000;
  }

  function focusApp() {
    if (unloaded) return;
    try {
      const w = /** @type {any} */ (typeof window !== 'undefined' ? window : null);
      if (w?.ea && typeof w.ea.showOrFocus === 'function') {
        w.ea.showOrFocus();
      }
      if (w && typeof w.focus === 'function') {
        w.focus();
      }
    } catch (err) {
      PluginAPI.log?.err?.('[pomodoro-focus-notifier] Failed to focus app:', err);
    }
  }

  function sendWarningNotification() {
    if (unloaded) return;
    const title = String(config.warningTitle || DEFAULT_CONFIG.warningTitle);
    const body = String(config.warningMessage || DEFAULT_CONFIG.warningMessage);
    const type = config.warningType || 'notify';

    if (type === 'notify' || type === 'both') {
      PluginAPI.notify({ title, body }).catch((err) => {
        PluginAPI.log?.warn?.('[pomodoro-focus-notifier] notify() failed:', err);
      });
    }

    if (type === 'snack' || type === 'both') {
      PluginAPI.showSnack({
        msg: `${title} – ${body}`,
        type: 'INFO',
        ico: 'timer',
      });
    }
  }

  /**
   * @param {{ type: string; [key: string]: unknown }} action
   */
  function handleFocusAction(action) {
    if (!action || typeof action.type !== 'string') return;

    switch (action.type) {
      case '[FocusMode] Start Session': {
        const duration =
          typeof action.duration === 'number'
            ? action.duration
            : DEFAULT_WORK_DURATION_MS;
        session.purpose = 'work';
        session.duration = duration;
        session.elapsed = 0;
        session.startedAt = Date.now();
        session.isPaused = false;
        session.warningFired = false;
        session.endHandled = false;
        break;
      }

      case '[FocusMode] Start Break': {
        const duration =
          typeof action.duration === 'number' && action.duration > 0
            ? action.duration
            : DEFAULT_BREAK_DURATION_MS;
        session.purpose = 'break';
        session.duration = duration;
        session.elapsed = 0;
        session.startedAt = Date.now();
        session.isPaused = false;
        session.warningFired = false;
        session.endHandled = false;
        break;
      }

      case '[FocusMode] Set Focus Session Duration': {
        if (
          session.purpose === 'work' &&
          typeof action.focusSessionDuration === 'number'
        ) {
          session.duration = action.focusSessionDuration;
        }
        break;
      }

      case '[FocusMode] Pause Session': {
        if (session.purpose && !session.isPaused) {
          session.elapsed = Date.now() - session.startedAt;
          session.isPaused = true;
        }
        break;
      }

      case '[FocusMode] Resume Session': {
        if (session.purpose && session.isPaused) {
          session.startedAt = Date.now() - session.elapsed;
          session.isPaused = false;
        }
        break;
      }

      case '[FocusMode] Adjust Remaining Time': {
        if (session.purpose === 'work' && typeof action.amountMs === 'number') {
          session.duration = Math.max(0, session.duration + action.amountMs);
          const remainingMs = session.duration - session.elapsed;
          if (remainingMs > getWarningMs()) {
            session.warningFired = false;
          }
          if (remainingMs > 0) {
            session.endHandled = false;
          }
        }
        break;
      }

      case '[FocusMode] Timer Tick': {
        if (!session.purpose || session.isPaused || session.duration <= 0) {
          return;
        }
        session.elapsed = Date.now() - session.startedAt;
        const remainingMs = session.duration - session.elapsed;

        if (session.purpose === 'work') {
          const warningMs = getWarningMs();
          if (
            config.enableOneMinuteWarning &&
            !session.warningFired &&
            remainingMs <= warningMs &&
            remainingMs > 0
          ) {
            session.warningFired = true;
            sendWarningNotification();
          }

          if (!session.endHandled && remainingMs <= 0) {
            session.endHandled = true;
            if (config.focusOnWorkEnd) {
              focusApp();
            }
          }
        } else if (session.purpose === 'break') {
          if (!session.endHandled && remainingMs <= 0) {
            session.endHandled = true;
            if (config.focusOnBreakEnd) {
              focusApp();
            }
          }
        }
        break;
      }

      case '[FocusMode] Complete Session': {
        if (!action.isManual && !session.endHandled && config.focusOnWorkEnd) {
          session.endHandled = true;
          focusApp();
        }
        resetSession();
        break;
      }

      case '[FocusMode] Complete Break': {
        if (!session.endHandled && config.focusOnBreakEnd) {
          session.endHandled = true;
          focusApp();
        }
        resetSession();
        break;
      }

      case '[FocusMode] Cancel Session':
      case '[FocusMode] Skip Break':
      case '[FocusMode] End Flowtime Session': {
        resetSession();
        break;
      }

      default:
        break;
    }
  }

  function init() {
    loadConfig();

    PluginAPI.registerHook(PluginAPI.Hooks.PERSISTED_DATA_CHANGED, () => {
      loadConfig();
    });

    PluginAPI.registerHook(PluginAPI.Hooks.ACTION, (payload) => {
      if (unloaded || !payload?.action) return;
      handleFocusAction(payload.action);
    });
  }

  if (typeof PluginAPI.onUnload === 'function') {
    PluginAPI.onUnload(() => {
      unloaded = true;
      resetSession();
    });
  }

  if (typeof PluginAPI.onReady === 'function') {
    PluginAPI.onReady(init);
  } else {
    init();
  }
})();
