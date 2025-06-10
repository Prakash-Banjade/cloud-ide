import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./authOptions";

export default async function auth() {
    const session = await getServerSession(authOptions);

    if (!session) redirect('/auth/login');

    return session;
}