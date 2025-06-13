import Appearance from "./components/appearance";
import PasswordAndAuthentication from "./components/password-and-authentication";
import PersonalInfo from "./components/personal-info";

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