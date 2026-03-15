# AnimBox

Plateforme de jeux interactifs à animer en soirée ou événement — pensée pour être utilisée avec un écran public (TV / vidéoprojecteur) et un téléphone comme télécommande.

## Ce que ça fait

- **Famille en Or** : jeu inspiré de *La Famille en Or* (Family Feud). L'animateur crée des questions, forme des équipes, et pilote la partie depuis son téléphone pendant que le public suit sur l'écran.
- **Écran public** (`/display`) : affiché sur la TV, sans authentification requise.
- **Panneau de contrôle** (`/control`) : accessible via QR code, public mais **un seul commandant à la fois** — le premier appareil connecté prend le contrôle exclusif via WebSocket.

## Stack

| Côté | Tech |
|------|------|
| Frontend | React + TypeScript + Vite, Tailwind v4, Zustand, React Router v6 |
| Backend | Java 21, Spring Boot 4, WebSocket (STOMP/SockJS), PostgreSQL |
| Infra | Docker Compose, Caddy (reverse proxy SSL), OVH VPS |
| CI/CD | GitHub Actions → Docker Hub → VPS via SSH |

## Architecture

```
animbox/
├── frontend/          React app (Vite)
│   ├── src/pages/     LoginPage, GamesPage, GameSetsPage, SessionLobbyPage,
│   │                  ControlPanelPage, DisplayPage, ...
│   ├── src/hooks/     useWebSocket (STOMP)
│   ├── src/stores/    useAuthStore (Zustand)
│   └── src/services/  API Axios
│
├── backend/           Spring Boot API
│   └── src/main/java/com/animbox/backend/
│       ├── auth/              JWT auth
│       ├── games/common/      GameSession, WebSocket controller, DTOs
│       ├── games/familyfeud/  Logique Famille en Or
│       └── config/            Security, WebSocket
│
├── docker-compose.dev.yml   PostgreSQL + pgAdmin + hot-reload
└── docker-compose.prod.yml  Images Docker Hub + réseau Caddy
```

## Lancer en local (dev)

**Prérequis** : Docker, Java 21, Node 20+

```bash
# 1. Base de données + pgAdmin
docker compose -f docker-compose.dev.yml up -d

# 2. Backend
cd backend
./mvnw spring-boot:run

# 3. Frontend
cd frontend
npm install
npm run dev
```

Frontend : http://localhost:5173
Backend : http://localhost:8080/api
pgAdmin : http://localhost:5050

## Lancer en prod

```bash
# Sur le VPS
cd ~/animbox
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Variables d'env requises dans `.env` :
```
DB_USERNAME=...
DB_PASSWORD=...
DB_NAME=animbox
JWT_SECRET=...          # min 32 caractères
JWT_EXPIRATION=86400000 # 24h en ms
```

URLs : `animbox.fr` (frontend) · `api.animbox.fr` (API)
