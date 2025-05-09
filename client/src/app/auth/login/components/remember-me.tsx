"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import usePersist from "@/hooks/use-persist";

export default function RememberMe() {
    const { persist, setPersist } = usePersist();

    return (
        <div className="flex items-center space-x-1">
            <Checkbox
                id="remember"
                checked={persist}
                onCheckedChange={(checked) => setPersist(checked as boolean)}
            />
            <Label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Remember this device?
            </Label>
        </div>
    )
}