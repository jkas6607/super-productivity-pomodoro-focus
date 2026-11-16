# Pomodoro Focus & 1-Min Warning (Super Productivity Plugin)

A lightweight plugin for **Super Productivity** (Desktop app) that solves two common issues:

1. **Automatically focus the app when the Pomodoro timer expires**: As soon as a Pomodoro work session ends, the Super Productivity window is brought to the foreground via `window.ea.showOrFocus()` (optionally also when a break ends).
2. **Configurable 1-minute warning notification**: Sends a configurable notification (OS system notification, in-app snackbar, or both) when 1 minute (or a custom number of seconds) remains.

## Installation

1. Download `plugin.zip` from the latest release (or pack it locally with `node scripts/pack.mjs`).
2. In Super Productivity, open **Settings → Plugins → Choose Plugin File** and select `plugin.zip`.

## Configuration

In **Settings → Plugins**, click **Configure** on the plugin:

- **Focus app on Pomodoro end** (default: `true`)
- **Focus app on break end** (default: `false`)
- **Enable pre-end warning notification** (default: `true`)
- **Warning time (in seconds)** (default: `60`, range: `5–600`)
- **Notification type**: `notify` (system notification), `snack` (in-app snackbar), or `both`
- **Notification title & message**: Customizable text
