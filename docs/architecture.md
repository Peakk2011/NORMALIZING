# Architecture

## Overview

Normalizing is structured as a layered Electron app:

- Main process (trusted orchestration)
- Preload layer (secure bridge)
- Renderer layer (user interface and user flows)

This keeps privileged APIs out of renderer code while preserving a fast UI loop.

## Layer Responsibilities

### Main Process

- Owns app lifecycle and window creation.
- Registers IPC channels (`open-external`, `open-url-html`).
- Applies session/request policies.
- Enforces webview/window security constraints.

Key files:

- `src/core/app/app_init.ts`
- `src/core/app/app_evt_hook.ts`
- `src/core/windows/w0.ts`
- `src/core/windows/w0_new.ts`

### Preload

- Exposes minimal APIs into renderer (`window.electronAPI`).
- Publishes environment metadata.
- Keeps renderer isolated from Node internals.

Key files:

- `src/preload/p0_init.ts`
- `src/preload/env/e1_bind.ts`
- `src/preload/env/e2_bind.ts`
- `src/preload/bridge/*`

### Renderer

- Owns UI and interaction logic.
- Implements search routing, history persistence, sidebar/modal, result page.
- Uses semantic CSS conventions (`c-*`, `u-*`, `is-*`) and shared tokens.

Key files:

- `src/renderer/app.ts`
- `src/renderer/url.ts`
- `src/renderer/impl/**/*`
- `src/renderer/stylesheet/**/*`

## Security Posture (Current)

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- external URL protocol filtering
- webview attachment hardening
- CSP on renderer HTML

## Design Principles

- Minimal bridge surface
- Explicit ownership per layer
- Fast path for common search flows
- Shared UI tokens/components to reduce style drift