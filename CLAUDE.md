# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **frontend** for the Keylime Monitoring Dashboard — a web-based security operations platform for centralized monitoring, management, and compliance of Keylime remote attestation infrastructure. The backend is a Rust/Axum server in the sibling `keylime-webtool-backend` repository. Full specifications live in `keylime-webtool-doc/spec/SRS-Keylime-Monitoring-Tool.md`.

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **Routing:** React Router v6
- **State:** Zustand (auth/UI state), TanStack Query (server state with caching/polling)
- **HTTP:** Axios with interceptors for JWT injection and error handling
- **Charts:** Recharts
- **Styling:** CSS Modules
- **Testing:** Vitest + React Testing Library

## Commands

```bash
npm install          # install dependencies
npm run dev          # dev server (default http://localhost:5173)
npm run build        # production build to dist/
npm run preview      # preview production build locally
npm run lint         # ESLint
npm run test         # run tests via Vitest
npm run test -- --run # run tests once (no watch)
```

## Architecture

### Module Structure

The app has 10 navigation modules, each in `src/pages/<Module>/`:

| Module | Route | Purpose |
|--------|-------|---------|
| Dashboard | `/` | Fleet KPIs, agent state distribution, recent alerts |
| Agents | `/agents` | Agent list with filtering/sorting/bulk actions; `/agents/:id` for 6-tab detail view |
| Attestations | `/attestations` | Failure analytics, latency, root cause suggestions |
| Policies | `/policies` | IMA/MB policy CRUD, versioning, two-person approval workflow |
| Certificates | `/certificates` | Certificate lifecycle, expiry tracking, renewal |
| Alerts | `/alerts` | Alert lifecycle (New → Acknowledged → Investigating → Resolved) |
| Performance | `/performance` | Verifier cluster metrics, DB pool, circuit breaker status |
| Audit Log | `/audit` | Tamper-evident security event log, hash chain verification |
| Integrations | `/integrations` | Backend service connectivity status |
| Settings | `/settings` | Configuration, compliance framework reports |

### Key Directories

- `src/api/` — Axios-based API client modules, one per domain (agents, policies, etc.)
- `src/types/` — TypeScript interfaces matching backend data models
- `src/hooks/` — Custom hooks (auth, WebSocket)
- `src/store/` — Zustand stores (auth state)
- `src/components/Layout/` — App shell: sidebar, top bar with search/time-range/notifications
- `src/components/common/` — Shared components (KpiCard, StatusBadge, DataTable)
- `src/pages/` — Page components organized by module

### Data Flow

```
React Components
  → TanStack Query (useQuery/useMutation with caching)
    → Axios client (src/api/client.ts, auto-injects JWT)
      → Backend API (default http://localhost:8080/api/*)

WebSocket (src/hooks/useWebSocket.ts)
  → Real-time KPI, alert, attestation push updates
  → Auto-reconnect with exponential backoff
```

### Authentication

OIDC/SAML flow → JWT (15-min expiry) stored in memory (Zustand). Three RBAC tiers: Viewer (read-only), Operator (read + moderate write), Admin (full access, MFA required). The auth store at `src/store/authStore.ts` manages tokens and user role.

### Agent Detail View

The agent detail page (`/agents/:id`) has 6 tabs: Timeline, PCR Values, IMA Log, Boot Log, Certificates, Raw Data. Each tab lazy-loads its data independently.

## Environment Variables

Prefixed with `VITE_` for Vite exposure to client code:

- `VITE_API_BASE_URL` — Backend API URL (default: `http://localhost:8080`)
- `VITE_WS_URL` — WebSocket URL (default: `ws://localhost:8080/ws`)

## Key Constraints

- **Air-gapped deployment** — no external CDN; all assets self-contained
- **TLS 1.3 minimum** for browser connections in production
- **WCAG 2.1 AA** accessibility compliance required
- **Never cache/store/log** raw TPM quotes, IMA logs, boot logs, or PoP tokens on the client
- **Two-person approval** for policy changes (drafter ≠ approver)
