import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function auth() {
    const session = await getServerSession(authOptions);

    if (!session) redirect('/auth/login');

    return session;
}