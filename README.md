# Iasty — Frontend

Next.js web app for [Iasty](../README.md): chat UI, auth flows, admin panel, and streaming message display.

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| [Next.js](https://nextjs.org/) | 16.3 | App Router, React framework |
| [React](https://react.dev/) | 19.2 | UI components |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Styling & design tokens |
| [Lucide React](https://lucide.dev/) | 1.31 | Icons |
| [react-markdown](https://github.com/remarkjs/react-markdown) | 10.x | Markdown rendering |
| [remark-gfm](https://github.com/remarkjs/remark-gfm) | 4.x | GFM tables, task lists |

---

## Quick Start

### Prerequisites

- **Node.js 20+**
- Backend running at http://localhost:8000 (see [Backend README](../Backend/README.md))

### Setup

```powershell
cd Frontend
npm install
```

Create `.env.local` (optional):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Run

```powershell
npm run dev
```

Open http://localhost:3000

### Production build

```powershell
npm run build
npm start
```

---

## Project Structure

```
Frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Main chat app
│   │   ├── layout.tsx          # Root layout, metadata, favicon
│   │   ├── globals.css         # Theme tokens & global styles
│   │   ├── admin/page.tsx      # Admin dashboard
│   │   ├── verify-email/       # Email verification flow
│   │   └── reset-password/     # Password reset flow
│   ├── components/
│   │   ├── ChatApp.tsx         # Main app shell & state
│   │   ├── Sidebar.tsx         # Chats, folders, navigation
│   │   ├── InputBar.tsx        # Message input, model picker, tools
│   │   ├── MessageList.tsx     # Streaming messages + markdown
│   │   ├── AuthDialog.tsx      # Login / register
│   │   ├── SettingsDialog.tsx  # Account & subscription
│   │   └── ...
│   ├── hooks/
│   │   ├── useAuth.ts          # JWT session management
│   │   ├── useChatScroll.ts    # Auto-scroll behavior
│   │   ├── useSpeechRecognition.ts
│   │   └── useSpeechSynthesis.ts
│   └── lib/
│       ├── api.ts              # Backend API client
│       └── formatError.ts      # Error formatting
└── public/branding/            # Iasty logos & icon
```

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Main chat application |
| `/verify-email` | Email verification landing page |
| `/reset-password` | Password reset form |
| `/admin` | Admin dashboard (admin users only) |

---

## Features (UI)

- **Streaming chat** — SSE tokens rendered in real time
- **Model picker** — disabled models show availability tooltip
- **Chat folders** — organize conversations (signed-in users)
- **Additional Data** — knowledge base management + per-chat RAG selection
- **PDF attach** — upload PDFs into chat context
- **Web search toggle** — Plus tier (when SerpAPI configured on backend)
- **Voice input / voice reply** — browser speech APIs
- **Dark / light theme** — theme-aware logos
- **Guest mode** — chat without account; persistent guest ID in `localStorage`
- **Settings** — update username, email, password, subscription plan

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |

Set in `.env.local` for local dev or in your hosting provider for production.

---

## API Client

All backend calls go through `src/lib/api.ts`:

- JWT stored in `localStorage` after login
- Guest ID in `localStorage` for anonymous sessions
- `getConfig()` — models, tiers, availability flags
- Chat messages use `fetch` + SSE stream parsing

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run lint` | ESLint |

---

## Development Notes

- Requires the **Backend** API running separately (not embedded in Next.js)
- CORS must allow the frontend origin in `Backend/.env` → `CORS_ORIGINS`
- For production, set `NEXT_PUBLIC_API_URL` to your deployed API URL
- Agent rules for Next.js live in `AGENTS.md` / `CLAUDE.md`

---

## Related

- [Root README](../README.md) — full project overview
- [Backend README](../Backend/README.md) — API server setup
