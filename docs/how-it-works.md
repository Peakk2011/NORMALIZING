# How It Works

## Runtime Layers

- `main`: controls Electron lifecycle, creates windows, owns IPC handlers, and applies session policies.
- `preload`: exposes a minimal safe API (`window.electronAPI`) and runtime environment info.
- `renderer`: renders UI and handles search input, history, sidebar, modal, and result-page behavior.

## Startup Flow

1. `src/main.ts` boots `createApplication()`.
2. `src/core/app/app_init.ts` configures runtime behavior and app hooks.
3. `src/core/app/app_evt_hook.ts` waits for `app.whenReady()`, sets session handlers, creates the main window.
4. `src/core/windows/w0.ts` and `src/core/windows/w0_new.ts` create/load the BrowserWindow.
5. Electron loads preload (`src/preload.cts` -> `src/preload/p0_init.ts`).
6. Renderer entry (`src/renderer/app.ts`) mounts UI and binds interactions.

## Search Flow (`index.html`)

1. Renderer mounts sidebar/modal shell.
2. Input detects:
   - normal platform query
   - direct URL
3. Search handler builds target URL:
   - platform route via `mk_req_url.ts`
   - direct URL via `makeHref()`
4. Search history is persisted in `localStorage`.
5. In Electron mode, app navigates to `url.html` with params.

## Result Flow (`url.html`)

1. Parse query params (`platform/query` or direct `target`).
2. Resolve final URL.
3. Load URL into `#result-frame` webview in Electron mode.
4. On fail, show feedback and optionally fall back to external open.
5. Keep sidebar/history/menu/search-modal available on result page.

## History + Sidebar

- History data managed by `src/renderer/impl/search/search.ts`.
- Rendering handled by:
  - `src/renderer/impl/io/drawer/history/history.ts`
  - `src/renderer/impl/io/drawer/history/item.ts`
- Sidebar state/modal behavior handled by:
  - `src/renderer/impl/io/drawer/sidebar/sidebar.ts`
  - `src/renderer/impl/io/drawer/modal/modal.ts`