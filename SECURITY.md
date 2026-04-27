# Security Policy

## Supported Versions

NORMALIZING is currently maintained as a single active line.
Security fixes are only guaranteed for the latest `1.0.x` code in this
repository unless the maintainers explicitly announce otherwise.

| Version | Supported |
| ------- | --------- |
| 1.0.x   | Yes       |
| < 1.0   | No        |

## Reporting a Vulnerability

If you believe you found a security issue, please report it privately rather
than opening a public issue first.

Include as much of the following as you can:

- affected version or commit
- environment details
- clear reproduction steps
- expected behavior
- actual behavior
- impact assessment
- screenshots, logs, or proof-of-concept details if available

If the issue involves Electron, preload, IPC, session handling, or webview
navigation, mention that explicitly. Those areas are especially important in
this project.

## What to Expect

Maintainers will aim to:

- acknowledge receipt of a report within 7 days
- reproduce and assess the issue
- decide whether the report is valid, needs more context, or is out of scope
- coordinate a fix and disclose it responsibly when appropriate

## Scope Notes

Security-relevant areas in this repository include:

- preload bridge exposure through `window.electronAPI`
- IPC channels such as `open-external` and `open-url-html`
- session policy and request/response header rewriting
- result-page navigation, direct URL handling, and webview behavior
- renderer handling of user-controlled content and stored history

## Disclosure

Please avoid publishing full exploit details until maintainers have had a
reasonable chance to investigate and ship a fix.
