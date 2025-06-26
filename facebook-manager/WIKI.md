# Facebook Page Manager Wiki

Diese Wiki-Seite dient als weiterführende Dokumentation für den Ordner `facebook-manager`.
Sie beschreibt die wichtigsten Schritte zur Einrichtung und Nutzung der Anwendung.

## Einleitung

Mit dem Facebook Page Manager lässt sich die Seite **"Techno auf den Augen"** über eine kleine Weboberfläche verwalten. Die Anwendung basiert auf Node.js mit Express und greift über die Facebook Graph API auf die Seite zu.

## Installation

1. Stelle sicher, dass Node.js (Version 18 oder höher) installiert ist.
2. Wechsle in das Verzeichnis `facebook-manager`.
3. Installiere die Abhängigkeiten:
   ```bash
   npm install
   ```

## Konfiguration

Die Anwendung benötigt einige Umgebungsvariablen, die in einer `.env`-Datei hinterlegt werden können:

- `FB_PAGE_ID` – numerische ID der Facebook-Seite
- `FB_ACCESS_TOKEN` – Long‑lived Page Access Token
- `PORT` – optionale Portangabe (Standard: `3000`)
- `API_VERSION` – optionale Graph API Version (Standard: `v18.0`)

Beispiel `.env`:
```env
FB_PAGE_ID=1234567890
FB_ACCESS_TOKEN=EAA...XYZ
PORT=3000
API_VERSION=v18.0
```

## Starten der Anwendung

Nach der Konfiguration kann der Server mit folgendem Befehl gestartet werden:
```bash
npm start
```
Anschließend ist die Oberfläche unter `http://localhost:3000` erreichbar.

## Funktionen der Weboberfläche

- **Posts anzeigen:** Listet die letzten Beiträge der Seite auf.
- **Neuen Beitrag erstellen:** Über ein Formular können neue Posts veröffentlicht werden.
- **Seiten-Insights:** Zeigt grundlegende Statistiken wie Reichweite und Interaktionen.
- **API-Version einstellen:** Über die Umgebungsvariable `API_VERSION` lässt sich die genutzte Graph API Version anpassen.

## Troubleshooting

- Prüfe bei Fehlermeldungen zunächst die gesetzten Umgebungsvariablen.
- Stelle sicher, dass das Access Token gültig und berechtigt ist, auf die Seite zuzugreifen.
- In den Logs der Anwendung finden sich weitere Hinweise bei Problemen.

## Weiterführende Links

- [Facebook Graph API Dokumentation](https://developers.facebook.com/docs/graph-api)
- [Offizielle Dokumentation zu Page Access Tokens](https://developers.facebook.com/docs/facebook-login/access-tokens)

