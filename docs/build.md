# Build Guide

## Overview

This document explains how to build `NORMALIZING` from source for Windows and macOS.

Important notes:

- Build `Windows` artifacts on Windows.
- Build `macOS` artifacts on macOS.
- Packaging is handled by `electron-builder`.
- The main build scripts are defined in `package.json`.

## Required Tools

### Required For Windows And macOS

- Node.js LTS
  - Download: https://nodejs.org/en/download
  - Required for `node`, `npm`, and the full build pipeline.
- Git
  - Download: https://git-scm.com/downloads
  - Required for cloning the repository and managing source code.

### Windows

- PowerShell or Command Prompt
  - Included with Windows.
- Visual Studio Build Tools
  - Download: https://visualstudio.microsoft.com/downloads/
  - Not always required for the current state of this project, but strongly recommended if native Node modules or additional Windows toolchain dependencies are added later.

### macOS

- Xcode
  - Download: https://developer.apple.com/xcode/
  - Required for macOS build, signing, and distribution workflows.
- Xcode Command Line Tools
  - Install guide: https://developer.apple.com/documentation/xcode/installing-the-command-line-tools/
  - Required for macOS command-line development and packaging tools.

## Project Setup

1. Clone the project.

```bash
git clone https://github.com/Peakk2011/NORMALIZING
cd NORMALIZING
```

2. Install dependencies.

```bash
npm install
```

3. Verify that your environment is ready.

```bash
node -v
npm -v
git --version
```

## Build For Windows

Run on Windows:

```powershell
npm run dist:win
```

This command will:

- compile TypeScript
- build the Electron main process
- build the renderer with Vite
- build the preload script
- copy `url.html`
- package the app with `electron-builder --win`

Build output:

- `release/NORMALIZING-v<version>-win-x64.exe`
- `release/win-unpacked/`

If you only want the compiled app without packaging an installer:

```powershell
npm run build
```

Output directory:

- `dist/`

## Build For macOS

Run on macOS:

```bash
npm run dist:mac
```

This command will:

- build the full application source
- package the app with `electron-builder --mac`

Build output:

- `release/`

If you only want the compiled app without packaging:

```bash
npm run build
```

## Development Commands

Run the Vite dev server and Electron together:

```bash
npm run normalizing
```

Run only the Vite dev server:

```bash
npm run dev:vite
```

## Common Issues

### `npm install` fails

- Make sure your Node.js version is recent enough.
- Remove `node_modules` and reinstall dependencies.
- Check whether your network, firewall, or proxy is blocking npm.

### The packaged app opens as a blank window

- Run `npm run build` again before packaging.
- Confirm that files were generated inside `dist/renderer/`.
- Run `npm run dist:win` or `npm run dist:mac` from the project root only.

### macOS build fails

- Confirm that Xcode is installed.
- Confirm that Xcode Command Line Tools are available.
- Check the active developer tools path:

```bash
xcode-select -p
```

If the tools are not installed yet:

```bash
xcode-select --install
```

## Notes

- This project already includes `win` and `mac` build scripts in `package.json`.
- If you plan to distribute the macOS app to external users, you will likely need code signing and notarization later.
- If you plan to build across platforms, review Electron and `electron-builder` cross-platform packaging limitations before relying on that workflow.