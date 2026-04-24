## Run

1. Build once
   `npm run build`
2. Start Electron (production build)
   `npm run start`

## Dev (auto compile TypeScript)

1. Terminal A (watch TypeScript + Vite dev server)
   `npm run dev`
2. Terminal B (run Electron and point to Vite)
   `npm run start:dev`

## Where to write code

- Main process: `src/main.ts`
- Renderer UI (Vite + TS): `src/renderer/main.ts`
- HTML entry: `index.html`