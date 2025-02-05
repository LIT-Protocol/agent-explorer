"use client";
import { NetworkSelector } from "@/app/components/NetworkSelector";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NavButton = ({
    href,
    active,
    children,
}: {
    href: string;
    active: boolean;
    children: React.ReactNode;
}) => (
    <Link
        href={href}
        className={`px-6 py-2 rounded-lg text-lg ${
            active
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
        }`}
    >
        {children}
    </Link>
);

export function Header({ network, setNetwork }: { 
    network: string;
    setNetwork: (value: string) => void;
}) {
    const pathname = usePathname();

    return (
        <div className="relative mb-8">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold">Agent Explorer</h1>
                <div className="flex items-center gap-4">
                    <NetworkSelector
                        value={network}
                        onValueChange={setNetwork}
                    />
                    <ConnectButton
                        accountStatus="address"
                        chainStatus="icon"
                        showBalance={false}
                    />
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <NavButton href="/" active={pathname === "/" || pathname.startsWith("/query/")}>
                    Query
                </NavButton>
                <NavButton href="/admin" active={pathname === "/admin" || pathname.startsWith("/admin/")}>
                    Admin
                </NavButton>
                <NavButton href="/delegatee" active={pathname === "/delegatee" || pathname.startsWith("/delegatee/")}>
                    Delegatee
                </NavButton>
            </div>
        </div>
    );
} 