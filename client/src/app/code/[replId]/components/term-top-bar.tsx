import { cn } from "@/lib/utils";
import { ChevronUp, Terminal, X } from "lucide-react"
import { useTheme } from "next-themes";
import { useEffect } from "react";

type Props = {
    setShowTerm: React.Dispatch<React.SetStateAction<boolean>>
    showTerm: boolean
}

export default function TermTopBar({ setShowTerm, showTerm }: Props) {
    const { theme } = useTheme();

    useEffect(() => {
        function handleTerminalShortcut(e: KeyboardEvent) {
            const key = e.key.toLowerCase();
            if ((e.ctrlKey || e.metaKey) && key === '`') {
                e.preventDefault();
                localStorage.setItem("showTerm", String(!showTerm));
                setShowTerm(prev => !prev);
            }
        }

        window.addEventListener("keydown", handleTerminalShortcut);

        return () => {
            window.removeEventListener("keydown", handleTerminalShortcut);
        }
    }, [])

    return (
        <div className={cn("flex justify-between items-center", theme === "dark" ? "bg-black" : "bg-white")}>
            <button type="button" className="p-2 underline underline-offset-2 pointer-events-none">
                <Terminal size={18} />
            </button>

            <button
                type="button"
                onClick={() => {
                    localStorage.setItem("showTerm", String(!showTerm));
                    setShowTerm(prev => !prev);
                }}
                title={showTerm ? 'Hide terminal' : 'Show terminal'}
                className={cn("p-2", !showTerm && "grow flex items-center justify-end")}
            >
                {
                    showTerm
                        ? <X size={18} />
                        : <ChevronUp size={18} />
                }
            </button>
        </div>
    )
}