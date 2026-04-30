<p align="center">
  <img src="https://mint-teams.web.app/Assets/NormalizingIcons.png" height="150px" width="150px"></img>
</p>

<h1 align='center'>Normalizing</h1> 
<br>

<p align='center'>Type once. Pick a platform. You're there.</p>

<p align='center'>
No new tabs. No navigating to the site first. <br>
No wasting time on steps that shouldn't exist.   
</p>

<br>
<img src='https://mint-teams.web.app/Assets/Normalizing.png'>
<br>

What Normalizing is doing now will become the new basis of discovery.<br>
Not following what already exists but setting new criteria that others will have to follow.<br>
Because when you see a better way, the old way becomes meaningless.<br>

## How it works

The project is split into three runtime layers:

- `main`: Electron app lifecycle, BrowserWindow creation, IPC, and session policy.
- `preload`: the safe bridge between Electron internals and the renderer.
- `renderer`: the UI, search flow, history, sidebar, modal, and result page logic.

## Run

### build

```bash
npm run build
npm run start
```

### Development

```bash
npm run dev
```

In a second terminal:

```bash
npm run start:dev
```

There is also a combined convenience script:

```bash
npm run normalizing
```

## App Flow

### 1. Desktop startup flow

1. `src/main.ts` calls `createApplication()`.
2. `src/core/app/app_init.ts` configures runtime flags, Electron command-line
   behavior, lifecycle hooks, and the GC loop.
3. `src/core/app/app_evt_hook.ts` waits for `app.whenReady()`, installs session
   handlers, and creates the main window.
4. `src/core/windows/w0.ts` asks `src/core/windows/w0_new.ts` to create the
   actual `BrowserWindow`.
5. That window loads either the Vite dev URL or the built renderer HTML,
   depending on `src/core/config/env.ts`.
6. Electron injects `src/preload.cts`, which boots `src/preload/p0_init.ts`.
7. Preload exposes `window.electronAPI`, exposes environment metadata, and
   installs the console bridge.
8. The renderer entry `src/renderer/app.ts` mounts the UI and wires up the page.

### 2. Search flow on `index.html`

1. `src/renderer/app.ts` waits for `DOMContentLoaded`.
2. It mounts sidebar markup with `mountSidebarParts()`.
3. It computes renderer environment info and stores it on `window.env`.
4. It initializes:
   - `initMenu()` for the platform menu
   - `initInput()` for textarea behavior and direct URL detection
   - `initBtn()` for platform button clicks
   - `initSidebar()` for history/search drawer behavior
   - `initSubstrate()` for small keyboard glue behavior
5. When the user searches:
   - `src/renderer/impl/search/search.ts` validates the query
   - `src/renderer/impl/search/mk_req_url.ts` builds the platform URL
   - search history is saved in `localStorage`
   - web mode redirects directly
   - Electron mode navigates to `url.html?platform=...&query=...`

### 3. Result page flow on `url.html`

1. `src/renderer/url.ts` reads the query string.
2. It decides whether the target is:
   - a platform search
   - or a direct URL
3. In Electron mode it loads the target into `#resultFrame` webview.
4. If webview loading fails, it falls back to `window.electronAPI.openExternal()`
   or `window.open()`.
5. The result page also initializes:
   - back navigation
   - in-page search modal
   - the same history sidebar shell
   - platform switching from the result page menu

### 4. History and sidebar flow

1. Every successful platform search is stored by
   `src/renderer/impl/search/search.ts`.
2. `src/renderer/impl/io/drawer/history/history.ts` fetches and renders the
   latest history items.
3. `src/renderer/impl/io/drawer/history/item.ts` builds one interactive item:
   main click, pin toggle, and delete.
4. `src/renderer/impl/io/drawer/sidebar/sidebar.ts` coordinates opening,
   closing, refresh, outside-click handling, and the search modal.

## Architecture

### Layer overview

#### Main process

The main process owns app lifecycle, window creation, IPC handlers, and session
policy. It never renders UI directly. Its job is to create trusted windows and
respond to renderer requests such as opening an external URL or opening a
dedicated result window.

#### Preload

The preload layer is the security and integration seam between Electron and the
renderer. It exposes a minimal API into `window`, publishes environment data,
and relays console activity so the renderer can stay isolated from direct Node
access.

#### Renderer

The renderer contains all page behavior. It is split into small modules around
responsibility:

- input and button handlers
- search URL building
- sidebar and drawer UI
- search history persistence
- result-page behavior
- shared browser environment typing

## File Naming Conventions

This repository uses short prefixes in several folders. They are conventions,
not TypeScript or Electron requirements.

- `app_*`: application bootstrap or lifecycle logic
- `w*`: window orchestration
- `p*`: preload entry or preload stage files
- `b*`: bridge logic between isolated contexts
- `c*`: console relay logic
- `e*`: environment detection or exposure
- `s*`: session setup
- `*_rt`: runtime logic or pure behavior
- `*_bind`: code that binds one layer to another, such as IPC, contextBridge,
  or browser events

Examples:

- `p0_init.ts`: the preload bootstrap entry
- `b1_bind.ts`: bridge binding logic injected into the renderer world
- `c1_rt.ts`: console serialization runtime helper
- `e2_bind.ts`: environment data binding into the renderer world
- `w0_new.ts`: low-level BrowserWindow factory

## File Meanings

### Root

- `.gitignore`: Git ignore rules
- `electron.d.ts`: Electron ambient typing helpers for the project
- `index.html`: main renderer page shell
- `url.html`: result page shell used after a search
- `package.json`: scripts, dependency manifest, app metadata
- `vite.config.mjs`: Vite config for renderer bundling
- `vite.main.mjs`: Vite config for Electron main build
- `vite.preload.mjs`: Vite config for preload build
- `tsconfig.json`: TypeScript project config
- `assets/`: static assets used by the app
- `dist/`: compiled output

### Main process files

- `src/main.ts`: Node-side entrypoint for Electron startup
- `src/core/app/app_init.ts`: high-level app bootstrap
- `src/core/app/app_evt_hook.ts`: Electron event and IPC registration
- `src/core/config/env.ts`: dev/build path resolution and runtime flags
- `src/core/config/s0.ts`: session policy such as request headers and frame rules
- `src/core/windows/w0.ts`: window registry and app-level window orchestration
- `src/core/windows/w0_new.ts`: BrowserWindow factory with concrete options

### Preload files

- `src/preload.cts`: preload bundle entry consumed by Electron
- `src/preload/p0_init.ts`: preload bootstrap
- `src/preload/bridge/b0_rt.ts`: bridge marker constants
- `src/preload/bridge/b1_bind.ts`: renderer console bridge injection
- `src/preload/bridge/b2_bind.ts`: message relay from renderer back to preload
- `src/preload/console/c0_rt.ts`: console method types and shared definitions
- `src/preload/console/c1_rt.ts`: console argument serializer
- `src/preload/console/c2_bind.ts`: preload console patching and forwarding
- `src/preload/env/e0_rt.ts`: environment detection runtime
- `src/preload/env/e1_bind.ts`: `electronAPI` exposure
- `src/preload/env/e2_bind.ts`: environment object exposure

### Renderer entry files

- `src/renderer/app.ts`: main page bootstrap
- `src/renderer/url.ts`: result page bootstrap
- `src/renderer/normalize.ts`: exports the visualizer entry used by search flows
- `src/renderer/types/window.d.ts`: shared renderer window typings

### Renderer implementation files

- `src/renderer/impl/data/usrspace.ts`: supported platforms and base URLs
- `src/renderer/impl/search/mk_req_url.ts`: query-to-platform URL builder
- `src/renderer/impl/search/search.ts`: search execution and history persistence
- `src/renderer/impl/io/btn.ts`: platform button click binding
- `src/renderer/impl/io/input.ts`: textarea behavior and direct URL navigation
- `src/renderer/impl/io/menu.ts`: platform menu open/close behavior
- `src/renderer/impl/io/sidebar.ts`: re-export for sidebar drawer bootstrap
- `src/renderer/impl/io/sidebar_parts.ts`: injected sidebar/modal markup shell
- `src/renderer/impl/io/hist_ctx.ts`: history item DOM helpers and menu markup
- `src/renderer/impl/hijack/substrate.ts`: lightweight keyboard glue behavior

### Drawer modules

- `src/renderer/impl/io/drawer/sidebar/dom.ts`: sidebar open/close/toggle helpers
- `src/renderer/impl/io/drawer/sidebar/sidebar.ts`: full sidebar controller
- `src/renderer/impl/io/drawer/sidebar/types.ts`: sidebar element contracts
- `src/renderer/impl/io/drawer/modal/dom.ts`: modal DOM helpers and page search
- `src/renderer/impl/io/drawer/modal/modal.ts`: modal behavior wiring
- `src/renderer/impl/io/drawer/modal/types.ts`: modal element contracts
- `src/renderer/impl/io/drawer/history/history.ts`: history list renderer
- `src/renderer/impl/io/drawer/history/item.ts`: one history item renderer
- `src/renderer/impl/io/drawer/history/types.ts`: history renderer types

### Styles and support files

- `src/renderer/stylesheet/base.css`: base layout and shared styling
- `src/renderer/stylesheet/search.css`: main page search UI styles
- `src/renderer/stylesheet/sidebar.css`: sidebar, history, and modal styles
- `src/renderer/stylesheet/typeface.css`: font definitions
- `src/renderer/stylesheet/url.css`: result page styles
- `src/types/app-alias.d.ts`: path alias typing for app modules
- `src/types/preload-alias.d.ts`: path alias typing for preload modules
- `src/visualizer/visualizer.ts`: user-facing prompt/feedback helper
- `src/visualizer/visualizer.css`: styles for the visualizer UI

## File Tree

```text
NORMALIZING/
|-- .gitignore
|-- electron.d.ts
|-- index.html
|-- LICENSE.md
|-- package-lock.json
|-- package.json
|-- README.md
|-- tsconfig.json
|-- tsconfig.tsbuildinfo
|-- url.html
|-- vite.config.mjs
|-- vite.main.mjs
|-- vite.preload.mjs
|-- assets/
|-- dist/
`-- src/
    |-- main.ts
    |-- preload.cts
    |-- core/
    |   |-- app/
    |   |   |-- app_evt_hook.ts
    |   |   `-- app_init.ts
    |   |-- config/
    |   |   |-- env.ts
    |   |   `-- s0.ts
    |   `-- windows/
    |       |-- w0.ts
    |       `-- w0_new.ts
    |-- preload/
    |   |-- p0_init.ts
    |   |-- bridge/
    |   |   |-- b0_rt.ts
    |   |   |-- b1_bind.ts
    |   |   `-- b2_bind.ts
    |   |-- console/
    |   |   |-- c0_rt.ts
    |   |   |-- c1_rt.ts
    |   |   `-- c2_bind.ts
    |   `-- env/
    |       |-- e0_rt.ts
    |       |-- e1_bind.ts
    |       `-- e2_bind.ts
    |-- renderer/
    |   |-- app.ts
    |   |-- normalize.ts
    |   |-- url.ts
    |   |-- impl/
    |   |   |-- data/
    |   |   |   `-- usrspace.ts
    |   |   |-- hijack/
    |   |   |   `-- substrate.ts
    |   |   |-- io/
    |   |   |   |-- btn.ts
    |   |   |   |-- hist_ctx.ts
    |   |   |   |-- input.ts
    |   |   |   |-- menu.ts
    |   |   |   |-- sidebar.ts
    |   |   |   |-- sidebar_parts.ts
    |   |   |   `-- drawer/
    |   |   |       |-- history/
    |   |   |       |   |-- history.ts
    |   |   |       |   |-- item.ts
    |   |   |       |   `-- types.ts
    |   |   |       |-- modal/
    |   |   |       |   |-- dom.ts
    |   |   |       |   |-- modal.ts
    |   |   |       |   `-- types.ts
    |   |   |       `-- sidebar/
    |   |   |           |-- dom.ts
    |   |   |           |-- sidebar.ts
    |   |   |           `-- types.ts
    |   |   `-- search/
    |   |       |-- mk_req_url.ts
    |   |       `-- search.ts
    |   |-- stylesheet/
    |   |   |-- base.css
    |   |   |-- search.css
    |   |   |-- sidebar.css
    |   |   |-- typeface.css
    |   |   `-- url.css
    |   `-- types/
    |       `-- window.d.ts
    |-- types/
    |   |-- app-alias.d.ts
    |   `-- preload-alias.d.ts
    `-- visualizer/
        |-- visualizer.css
        `-- visualizer.ts
```

## Notes

- The app currently uses `localStorage` for renderer search history.
- The result page can work in both browser mode and Electron mode.
- Preload keeps `nodeIntegration` disabled and exposes only the minimum API.
- Session handling currently relaxes some browser restrictions to support the
  in-app browsing model used by the webview-based result page.

## Policies

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Contributing](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)
