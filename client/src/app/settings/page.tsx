import { useCustomSearchParams } from "@/hooks/useCustomSearchParams";
import { z } from "zod";
import { useMemo } from "react";
import PersonalInfo from "./components/personal-info";
import Appearance from "./components/appearance";
import PasswordAndAuthentication from "./components/password-and-authentication";
import SettingTabs from "./components/settings-tabs";

export const settignsTabs = [
    {
        id: 0,
        name: 'personal-info',
        label: 'My Info',
        content: <PersonalInfo />,
    },
    {
        id: 1,
        name: 'appearance',
        label: 'Appearance',
        content: <Appearance />,
    },
    {
        id: 2,
        name: 'password-and-authentication',
        label: 'Password and Authentication',
        content: <PasswordAndAuthentication />,
    },
    // {
    //     id: 3,
    //     name: 'device-activity',
    //     label: 'Your Devices',
    //     content: <SessionDevices />,
    // }
]

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