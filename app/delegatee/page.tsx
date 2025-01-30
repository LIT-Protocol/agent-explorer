"use client";
// import { AgentSecurityChecker } from "../page";
import { Header } from "@/app/components/Header";
import { useState } from "react";

export default function DelegatePage() {
    const [network, setNetwork] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("selectedNetwork") || "datil-dev";
        }
        return "datil-dev";
    });

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Header network={network} setNetwork={setNetwork} />
            {/* Delegatee page content will go here */}
        </div>
    );
} 