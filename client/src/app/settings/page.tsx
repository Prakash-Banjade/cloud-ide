import { z } from "zod";
import { settignsTabs } from "../../components/settings/tabs";
import SettingTabs from "@/components/settings/settings-tabs";

const tabsSchema = z.enum(["personal-info", "appearance", "password-and-authentication", "device-activity"]);

type Props = {
    searchParams: {
        tab?: string;
    }
}

export default async function SettingsPage(props: { searchParams: Promise<Props["searchParams"]> }) {
    const { tab } = await props.searchParams;

    const { success, data } = tabsSchema.safeParse(tab);

    const activeTab = success ? (settignsTabs.find(tab => tab.name === data)?.id || settignsTabs[0].id) : settignsTabs[0].id;

    return (
        <section>
            <header className="mb-8 space-y-1">
                <h1 className="text-3xl font-semibold">Settings</h1>
                <p className="text-sm text-muted-foreground">Manage your account settings.</p>
            </header>
            <section className="max-w-full overflow-x-auto">
                <SettingTabs defaultActive={activeTab} />
            </section>

            <div className="max-w-screen-lg w-full mx-auto mt-8">
                {
                    settignsTabs.find(tab => tab.id === activeTab)?.content
                }
            </div>
            <section className='h-20'></section>
        </section>
    )
}