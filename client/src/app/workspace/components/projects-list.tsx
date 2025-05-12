import { serverFetch } from "@/lib/axios-server"
import { redirect } from "next/navigation";

type Props = {}

export default async function MyProjectsList({ }: Props) {
    const res = await serverFetch("projects");

    if (!res.ok) redirect("/auth/login");

    const projects = await res.json();

    return (
        <div>{JSON.stringify(projects)}</div>
    )
}