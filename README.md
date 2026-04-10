# Keylime Monitoring Dashboard - Frontend

Web-based frontend for the Keylime Monitoring Dashboard, providing centralized monitoring, management, and compliance for Keylime remote attestation infrastructure.

Built with React 18, TypeScript, Vite, and React Router.

## Prerequisites

- Node.js 18+
- npm

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app runs at http://localhost:5173 by default. API requests are proxied to http://localhost:8080 (the backend).

## Available Scripts

| Command             | Description                        |
|---------------------|------------------------------------|
| `npm run dev`       | Start development server with HMR  |
| `npm run build`     | Type-check and build for production |
| `npm run preview`   | Preview the production build       |
| `npm run lint`      | Run ESLint                         |
| `npm run test`      | Run tests with Vitest              |

## Environment Variables

Create a `.env.local` file to override defaults:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
```

## Project Structure

```
src/
  api/          - API client modules (Axios)
  components/   - Reusable UI components (Layout, DataTable, KpiCard, etc.)
  hooks/        - Custom React hooks (auth, WebSocket)
  pages/        - Page components for each module
  store/        - Zustand state stores
  types/        - TypeScript type definitions
```

## License

Apache-2.0
