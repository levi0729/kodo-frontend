# Kodo Workspace

Modern, letisztult team management alkalmazás React + Tailwind CSS keretrendszerrel.

## Funkciók

- **Dashboard** — Személyre szabott áttekintés az aktív projektről: saját feladatok, projekt kártyák haladás-jelzővel, heti aktivitás grafikon (H-P, csapatonkénti óra), feladat lista, mini naptár, ütemterv, csapattagok
- **Csapatok** — Csapatkártyák tagokkal, leírással, projekt számmal; kattintásra részletes tagok + projektek nézet
- **Projektek** — Kanban tábla 4 oszloppal (Teendő, Folyamatban, Review, Kész), prioritás badge, határidő, progress bar
- **Üzenetek** — Csatorna lista + direkt üzenetek sidebar, valós idejű chat nézet reakciókkal, pin, mention
- **Naptár** — Heti nézet időrácsos megjelenítéssel, szűrők (Összes/Események/Meetingek/Emlékeztetők), nap/hét/hónap váltás
- **Fájlok** — Fájlkezelő táblázat típus ikonokkal, méret, feltöltő, verzió
- **Beállítások** — Profil szerkesztés, téma, nyelv, értesítés togglek

## Projekt váltás

A bal oldali sidebar tetején lévő **projekt választóval** lehet projektek között váltani. Minden oldal (Dashboard, Projektek, Naptár, Fájlok, stb.) az aktív projekt kontextusát mutatja — a breadcrumb is kiírja melyik projektben vagyunk.

## Tech Stack

- **React 18** + Vite
- **Tailwind CSS 3.4**
- **Lucide React** ikonok
- **clsx** utility

## Telepítés

```bash
npm install
npm run dev
```

A frontend a `http://localhost:5173` (vagy ha foglalt, akkor más port) címen fut.

A backend API-t a `server/` mappában lévő Node.js szerver biztosítja, amelyet külön kell elindítani:

```bash
cd server
npm install
npm run dev
```

A frontend ellenőrzi, hogy a backend elérhető-e (`http://localhost:3001/api/health`) és ha nem, akkor egy figyelmeztető sáv jelenik meg.

## Build

```bash
npm run build
```

## Struktúra

```
kodo/
├── public/
│   └── kodo.svg
├── src/
│   ├── components/
│   │   ├── Avatar.jsx
│   │   ├── Badges.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── Sidebar.jsx
│   │   └── TopBar.jsx
│   ├── context/
│   │   └── ProjectContext.jsx
│   ├── data/
│   │   └── mockData.js
│   ├── pages/
│   │   ├── Calendar.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Files.jsx
│   │   ├── Messages.jsx
│   │   ├── Projects.jsx
│   │   ├── Settings.jsx
│   │   └── Teams.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## Adatbázis séma

Az alkalmazás mock adatai a `kodo_er_diagram.mermaid` ER diagramon alapulnak, amely tartalmazza:
Users, Organizations, Teams, Channels, Messages, Projects, Tasks, Calendar Events, Files, Notifications, Time Entries, Friendships.
