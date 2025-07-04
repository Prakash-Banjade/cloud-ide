import { SettingThemeToggle } from "./setting-theme-toggle";

export default function Appearance() {
    return (
        <section className='px-1 space-y-8'>
            <header>
                <h2 className="text-2xl font-medium">Theme</h2>
                <p className='text-muted-foreground text-sm'>Toggle between the light and dark themes.</p>
            </header>
            
            <SettingThemeToggle />
        </section>
    )
}