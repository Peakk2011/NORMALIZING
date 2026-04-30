# System Design

## Product Goal

Reduce friction between user intent and destination by turning multi-step web navigation into a single, reusable search flow.

## Core User Loop

1. User types query once.
2. User chooses platform (or direct URL).
3. App resolves destination.
4. Result opens in-app (Electron) or browser route (web mode).
5. History updates for quick replay.

## Main Components

### Query Resolver

- Determines if input is a URL or platform query.
- URL normalization via `makeHref()`.
- Platform URL building via `mk_req_url.ts`.

### Navigation Engine

- In Electron: route through `url.html`, then load to webview.
- In web mode: direct browser navigation.

### History Store

- Backed by `localStorage`.
- Supports create/read/delete/rename/pin behavior.
- Keeps active record state for contextual UX.

### UI Shell

- Shared sidebar + modal shell mounted in both home and result pages.
- Menu/dropdown uses shared component styles (`components/menu.css`).

## Styling System

### Naming

- `c-*` component classes
- `u-*` utility classes
- `is-*` state classes

### Tokens

Located in `src/renderer/stylesheet/tokens.css`:

- `--theme-*` palette and base colors
- `--radius-*` corner system
- `--shadow-*` reusable depth and glass effects

## Operational Characteristics

- Multi-window support for result pages with cap control.
- Dev and production runtime paths separated via environment config.
- Build pipeline split for renderer/main/preload.