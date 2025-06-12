import auth from '@/lib/auth';

export default async function PersonalInfo() {
    const session = await auth();

    const { user: { firstName, lastName, email } } = session;

    return (
        <section className='w-full'>
            <h2 className="text-2xl font-medium mb-4">Profile Information</h2>

            <div className="flex items-center space-x-4">
                {/* <ProfileAvatar name={payload?.firstName + " " + payload?.lastName} src={getImageUrl(payload?.profileImageUrl, "w=96")} className="size-24" /> */}
                <div>
                    <p className="font-semibold text-xl mb-2">{firstName} {lastName}</p>
                    <p className="text-muted-foreground">{email}</p>
                </div>
            </div>
        </section>
    )
}