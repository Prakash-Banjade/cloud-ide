
export function NoFileSelected() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <img src="/logo-white.png" alt="logo" className="opacity-5 hidden dark:block h-[30%] w-auto select-none" />
            <img src="/logo-dark.png" alt="logo" className="opacity-5 block dark:hidden h-[30%] w-auto select-none" />
            <table className="text-sm">
                <tbody>
                    <tr>
                        <td className="p-2 text-right">Toggle Terminal</td>
                        <td className="p-2">
                            <kbd className="py-1 px-2 rounded-sm bg-sidebar/70">Ctrl</kbd> + <kbd className="py-1 px-2 rounded-sm bg-sidebar/70">`</kbd>
                        </td>
                    </tr>
                    <tr>
                        <td className="p-2 text-right">Tab Switching</td>
                        <td className="p-2">
                            <kbd className="py-1 px-2 rounded-sm bg-sidebar/70">Alt</kbd> + <kbd className="py-1 px-2 rounded-sm bg-sidebar/70">e</kbd>
                        </td>
                    </tr>
                    <tr>
                        <td className="p-2 text-right">Manual Save</td>
                        <td className="p-2">
                            <kbd className="py-1 px-2 rounded-sm bg-sidebar/70">Ctrl</kbd> + <kbd className="py-1 px-2 rounded-sm bg-sidebar/70">s</kbd>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export function updateRemoteCursorStyle(userId: string, user: { name: string }, color = "red") {
    const className = `remoteCursor-${userId}`;

    // ensure css exists
    if (!document.getElementById(className)) {
        const style = document.createElement('style');
        style.id = className;
        style.textContent = `
                .${className} {
                    position: relative;
                    border-left: 2px solid ${color};
                    z-index: 5;
                }
                    .${className}::before {
                        content: "${user.name}";
                        position: absolute;
                        z-index: 100;
                        background: ${color};
                        color: #fff;
                        padding: 2px 6px;
                        font-size: 12px;
                        border-radius: 4px;
                        border-bottom-left-radius: 0;
                        bottom: 100%;
                        left: -2px;
                        white-space: nowrap;
                    }
                `;
        document.head.appendChild(style);
    }
}

export function udpateRemoteSelectionStyle(userId: string, color: string) {
    const id = `remoteSelection-${userId}`;

    if (!document.getElementById(id)) {
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
      .monaco-editor .${id} {
        background-color: ${hexToRgba(color, 0.35)};
      }
    `;
        document.head.appendChild(style);
    }
}

export function hexToRgba(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

export function removeInjectedCss(userId: string) {
    [
        `remoteCursor-${userId}`, // cursor
        `remoteSelection-${userId}`, // selection
    ].forEach(styleSelector => {
        const styleEl = document.getElementById(styleSelector);
        if (styleEl) styleEl.remove();
    })
}

export const langObj = {
    "js": "javascript",
    "jsx": "javascript",
    "ts": "typescript",
    "tsx": "typescript",
    "py": "python",
    "html": "html",
    "htm": "html",
    "css": "css",
    "json": "json",
    "md": "markdown",
    "c": "c",
    "cpp": "cpp",
    "c++": "cpp",
    "mjs": "javascript",
    "java": "java",
}

export function getLanguageFromName(name: string) {
    const ext = name.split('.').pop();

    return langObj?.[ext as keyof typeof langObj] || "plaintext";
}

