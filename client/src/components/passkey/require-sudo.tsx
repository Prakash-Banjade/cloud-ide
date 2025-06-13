"use client";

import React, { useState } from "react";
import SudoActionConfirmPage from "./sudo-access-confirm.page";

interface Props {
    children: React.ReactNode;
}

const RequireSudo = ({ children }: Props) => {
    const [isVerified, setIsVerified] = useState<boolean>(false);

    return !!isVerified ? (
        <>{children}</>
    ) : (
        <SudoActionConfirmPage setIsVerified={setIsVerified} />
    );
};

export default RequireSudo;