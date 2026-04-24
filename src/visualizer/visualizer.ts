export interface AlertButton {
    label: string
    style?: "default" | "cancel" | "destructive"
    handler?: () => void
}

export interface AlertConfig {
    title: string
    message?: string
    buttons?: AlertButton[]
}

export type AlertResult = string

const resolveButton = (buttons: AlertButton[]): string => {
    const cancel = buttons.find((b) => b.style === "cancel")
    return cancel?.label ?? buttons[0]?.label ?? "Confirm"
}

const createButton = (
    btn: AlertButton,
    onClick: (btn: AlertButton) => void
): HTMLButtonElement => {
    const el = document.createElement("button")
    el.className = [
        "vz-btn",
        btn.style === "cancel" ? "vz-cancel" : "",
        btn.style === "destructive" ? "vz-destructive" : "",
    ]
        .filter(Boolean)
        .join(" ")
    el.textContent = btn.label
    el.addEventListener("click", () => onClick(btn))
    return el
}

const createDialog = (config: AlertConfig, buttons: AlertButton[]): HTMLDivElement => {
    const dialog = document.createElement("div")
    dialog.className = "vz-dialog"
    dialog.setAttribute("role", "alertdialog")
    dialog.setAttribute("aria-modal", "true")
    dialog.setAttribute("aria-labelledby", "vz-title")

    const body = document.createElement("div")
    body.className = "vz-body"

    const titleEl = document.createElement("p")
    titleEl.id = "vz-title"
    titleEl.className = "vz-title"
    titleEl.textContent = config.title
    body.appendChild(titleEl)

    if (config.message) {
        const msgEl = document.createElement("p")
        msgEl.className = "vz-message"
        msgEl.textContent = config.message
        body.appendChild(msgEl)
    }

    const btnRow = document.createElement("div")
    btnRow.className = ["vz-buttons", buttons.length > 2 ? "vz-vertical" : ""]
        .filter(Boolean)
        .join(" ")

    dialog.appendChild(body)
    dialog.appendChild(btnRow)

    return dialog
}

export const Visualizer = (config: AlertConfig): Promise<AlertResult> => {
    const buttons: AlertButton[] =
        config.buttons && config.buttons.length > 0
            ? config.buttons
            : [{ label: "Confirm", style: "default" }]

    return new Promise<AlertResult>((resolve) => {
        const overlay = document.createElement("div")
        overlay.className = "vz-overlay"

        const dialog = createDialog(config, buttons)
        const btnRow = dialog.querySelector(".vz-buttons") as HTMLDivElement

        const dismiss = (label: string, handler?: () => void): void => {
            overlay.classList.remove("vz-visible")
            setTimeout(() => {
                document.body.removeChild(overlay)
                handler?.()
                resolve(label)
            }, 220)
        }

        buttons.forEach((btn) => {
            btnRow.appendChild(createButton(btn, (b) => dismiss(b.label, b.handler)))
        })

        overlay.appendChild(dialog)
        document.body.appendChild(overlay)

        requestAnimationFrame(() =>
            requestAnimationFrame(() => overlay.classList.add("vz-visible"))
        )

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) dismiss(resolveButton(buttons))
        })

        document.addEventListener(
            "keydown",
            (e) => {
                if (e.key === "Escape") dismiss(resolveButton(buttons))
            },
            { once: true }
        )
    })
}
