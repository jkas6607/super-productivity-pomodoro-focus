# Pomodoro Focus & 1-Min Warning (Super Productivity Plugin)

Ein leichtgewichtiges Plugin für **Super Productivity** (Desktop-App), das zwei Probleme löst:

1. **App automatisch fokussieren nach Pomodoro-Ende**: Sobald der Pomodoro-Timer abgelaufen ist, wird das Super-Productivity-Fenster über `window.ea.showOrFocus()` in den Vordergrund geholt (optional auch nach Pausen-Ende).
2. **Konfigurierbare 1-Minuten-Vorwarnung**: Sendet eine konfigurierbare Benachrichtigung (System-Notification, In-App-Snackbar oder beides), wenn noch 1 Minute (bzw. eine frei einstellbare Zeit in Sekunden) übrig ist.

## Installation

1. Plugin packen (falls noch nicht geschehen):
   ```bash
   node scripts/pack.mjs
   ```
   Dadurch wird `plugin.zip` erzeugt.
2. In Super Productivity öffnen: **Einstellungen → Plugins → Plugin-Datei auswählen** und `plugin.zip` hochladen.

## Konfiguration

In **Einstellungen → Plugins** beim Plugin auf **Konfigurieren** klicken:

- **App nach Pomodoro-Ende fokussieren** (Standard: `true`)
- **App nach Pausen-Ende fokussieren** (Standard: `false`)
- **Vorwarn-Benachrichtigung aktivieren** (Standard: `true`)
- **Vorwarnzeit (in Sekunden)** (Standard: `60`)
- **Benachrichtigungs-Art**: `notify` (System-Benachrichtigung), `snack` (In-App-Hinweis) oder `both` (Beides)
- **Titel & Text der Benachrichtigung** frei anpassbar
