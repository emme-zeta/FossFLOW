# Connessioni animate e stato live

Questo fork aggiunge a FossFLOW due funzioni pensate per i diagrammi di infrastruttura:

1. **Connessioni animate**: un flusso che scorre lungo la linea (ad esempio i dati che vanno verso un backup).
2. **Stato live**: nodi e connessioni si colorano in base a un feed JSON aggiornato dai tuoi sistemi (Backrest, Zabbix, Uptime Kuma, n8n…).

Entrambe restano modificabili a mano nell'editor, come qualsiasi altra proprietà.

## Nell'editor

**Connessione** (clic sulla linea):
- *Animated flow*: attiva o disattiva il flusso animato.
- *Live status key*: la chiave da cercare nel feed, ad esempio `backup:server-web`.

**Nodo** (clic sull'icona):
- *Live status key*: ad esempio `server-web`. Sopra l'icona compare un pallino colorato.

| Valore nel feed | Colore | Effetto |
|---|---|---|
| `ok` / `up` / `success` / `true` | verde | il flusso scorre se *Animated flow* è attivo |
| `running` / `active` / `syncing` | blu | flusso veloce e pallino pulsante (job in corso) |
| `warning` / `degraded` / `stale` | arancione | |
| `error` / `down` / `failed` / `false` | rosso | il flusso **si ferma** e il pallino pulsa |
| chiave assente nel feed | colore normale della linea | |

## Formato del feed

L'app legge `/live-status.json` ogni 30 secondi. Se la risposta è 404, lo stato live resta spento senza errori.

```json
{
  "updated": "2026-11-05T17:00:00+01:00",
  "status": {
    "server-web": "ok",
    "backup:server-web": "running",
    "backup:server-mail": { "status": "error", "detail": "repo locked" }
  }
}
```

È accettata anche una mappa piatta (`{ "server-web": "ok" }`).

Parametri utili nell'URL:
- `?status=https://altro/feed.json`: usa un altro feed (attenzione a CORS)
- `?statusInterval=10`: intervallo di aggiornamento in secondi
- `?status=off`: disattiva lo stato live

## Docker: da dove arriva il feed

Il container serve `/live-status.json` in due modi:

- **File locale**: monta un file in `/data/live-status.json` (ad esempio scritto da un cron o da n8n).
- **Proxy**: `LIVE_STATUS_URL=http://servizio-interno/status.json`. Lo legge nginx lato server, quindi niente CORS e nessuna credenziale nel browser. Se la sorgente è protetta da basic-auth: `LIVE_STATUS_AUTH=utente:password`.

Esempio dietro Traefik, con basic-auth sull'app:

```yaml
services:
  fossflow:
    build: .
    restart: unless-stopped
    environment:
      - ENABLE_SERVER_STORAGE=true
      - LIVE_STATUS_URL=http://dash-data/live-status.json
    volumes:
      - ./diagrams:/data/diagrams
    labels:
      - traefik.enable=true
      - traefik.http.routers.infra.rule=Host(`infra.example.com`)
      - traefik.http.routers.infra.entrypoints=websecure
      - traefik.http.routers.infra.tls.certresolver=letsencrypt
      - traefik.http.routers.infra.middlewares=infra-auth
      - traefik.http.middlewares.infra-auth.basicauth.usersfile=/etc/traefik/infra.htpasswd
      - traefik.http.services.infra.loadbalancer.server.port=80
```

> ⚠️ Non pubblicare su GitHub Pages un diagramma con IP o dettagli reali: le pagine di Pages sono pubbliche.

## Uso da codice (libreria)

```ts
import { setLiveStatus } from 'fossflow';
setLiveStatus({ status: { 'server-web': 'ok' } });
```
