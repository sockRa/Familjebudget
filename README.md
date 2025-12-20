# Familjebudget

En delad budgetapp för familjen. Kör lokalt på hemmanätverket via Proxmox.

## Funktioner

- ✅ **Inkomster** - Lägg till obegränsat antal inkomstkällor per person
- ✅ **Utgifter** med tydliga betalningsmetoder:
  - E-faktura
  - Autogiro (Person 1)
  - Autogiro (Person 2)
  - Autogiro (Gemensamt konto)
- ✅ **Betalningsstatus** - Markera utgifter som obetald/pågående/betald
- ✅ **Överföringsvisning** - Se hur mycket som dras från gemensamt konto
- ✅ **Kategorier** - Organisera utgifter
- ✅ **Historik** - Jämför månader
- ✅ **Mörkt/ljust tema**
- ✅ **Anpassningsbara namn** - Ändra "Person 1" och "Person 2" i inställningar

## Snabbstart (utveckling)

```bash
# Installera alla dependencies
npm run install:all

# Starta backend + frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Produktion (Proxmox/Docker)

```bash
docker compose up -d
```

Appen körs på port 3000.

## Tester

```bash
npm test
```

## Projektstruktur

```
Budget/
├── backend/           # Express + SQLite API
│   ├── src/
│   │   ├── index.ts          # Server
│   │   ├── db.ts             # Databas
│   │   ├── calculations.ts   # Beräkningslogik
│   │   └── routes/           # API endpoints
│   └── package.json
├── frontend/          # Vite + React
│   ├── src/
│   │   ├── App.tsx           # Main app
│   │   ├── types.ts          # Typer + helpers
│   │   └── index.css         # Design system
│   └── package.json
├── docker-compose.yml
├── Dockerfile
└── package.json       # Root scripts
```
