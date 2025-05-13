import { useEffect, useState } from "react";
import { useCustomSearchParams } from "@/hooks/useCustomSearchParams";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";

type Props = {
    placeholder?: string;
    searchKey?: string;
    className?: string;
}

export default function SearchInput({ placeholder, searchKey = "search", className }: Props) {
    const { searchParams, setSearchParams } = useCustomSearchParams();
    const [searchTerm, setSearchTerm] = useState<string>(searchParams.get(searchKey) || '');

    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchParams(searchKey, searchTerm?.trim());
        }, 500);

        return () => clearTimeout(handler);
    }, [searchTerm]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    return (
        <Input
            type="search"
            placeholder={placeholder ?? "Search..."}
            value={searchTerm}
            onChange={handleInputChange}
            className={cn("min-w-[300px]", className)}
        />
    )
}