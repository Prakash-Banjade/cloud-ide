import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./authOptions";
import { cache } from "react";

export const auth = cache(async () => {
    const session = await getServerSession(authOptions);

    if (!session) redirect('/auth/login');

    return session;
});