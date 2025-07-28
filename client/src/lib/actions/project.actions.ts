"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import { serverFetch } from "../axios-server";

export async function deleteProject(projectId: string): Promise<{ message: string }> {
    await auth();

    const res = await serverFetch(`/projects/${projectId}`, { method: "DELETE" });

    if (!res.ok) throw new Error("Failed to delete project");

    const data = await res.json();

    revalidatePath("/workspace"); // revalidate the loaded projects list
    
    return data;
}