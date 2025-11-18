import { QUBIDE_DOMAIN } from "@/lib/CONSTANTS";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function useUrl() {
    const { replId } = useParams();

    const runnerUrl = useMemo(() => {
        return process.env.NODE_ENV === "production"
            ? `https://runner.${replId}.${QUBIDE_DOMAIN}`
            : "http://localhost:3003"
    }, [replId]);

    return { runnerUrl };
}