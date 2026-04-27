## You need to do it before start:

- Read [README.md](./README.md) for the app flow and architecture.
- Check existing issues or open a short discussion before making large changes.
- Keep changes focused. Small, well-scoped pull requests are easier to review.

## Development Setup

Install dependencies:

```bash
npm install
```

Run the TypeScript watcher and Vite dev server:

```bash
npm run dev
```

Run Electron against the dev server in another terminal:

```bash
npm run start:dev
```

Or run the combined workflow:

```bash
npm run normalizing
```

## Build

```bash
npm run build
```

TypeScript-only verification:

```bash
npm run build:ts
```

## Guidelines

- Prefer existing patterns over introducing a new structure.
- Keep renderer, preload, and main-process responsibilities separate.
- When adding a bridge API, document why it belongs in preload.
- Avoid broad refactors mixed with behavior changes.
- If you touch search or history behavior, test both `index.html` and `url.html`.
- If you touch preload or window creation, fully restart Electron before
  validating the result.

## Conventions

- TypeScript is the default for application code.
- Use small modules with one clear responsibility.
- Follow the current naming pattern used in the repo:
  `*_bind`, `*_rt`, `w*`, `p*`, `e*`, `b*`, `c*`, and `s*`.
- Prefer DOM-safe APIs such as `textContent` when rendering user-controlled text.
- Keep Electron-facing APIs narrow and explicit.

## Pull Requests

Please include:

- why the change is needed
- how you tested it
- screenshots or short clips for visible UI changes when relevant

Good pull requests usually:

- change one behavior or one feature area
- include a minimal explanation of tradeoffs
- avoid unrelated formatting churn

## Testing Expectations

This project does not yet have a full automated test suite.
For now, contributors should at least verify:

- `npm run build:ts` pass
- the main search flow works on `index.html`
- the result flow works on `url.html`
- the sidebar, history, and modal still function after the change

## Documentation

If you change architecture, file ownership, boot flow, preload APIs, or naming
conventions, update `README.md` in the same pull request.