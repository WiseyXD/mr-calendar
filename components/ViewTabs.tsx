import Link from "next/link"

import { cn } from "@/lib/utils"

export function ViewTabs({ active, todayCount }: { active: "all" | "today"; todayCount: number }) {
    const tabs = [
        { key: "all", label: "All MRs", href: "/" },
        { key: "today", label: `Today (${todayCount})`, href: "/?view=today" },
    ] as const

    const base = "rounded-md px-3 py-2 text-center text-sm font-medium transition-colors"

    return (
        <nav aria-label="View" className="grid grid-cols-2 rounded-lg bg-muted p-1 sm:inline-grid sm:w-80">
            {tabs.map((tab) =>
                // the active tab isn't a link, so tapping it never clears the search
                tab.key === active ? (
                    <span key={tab.key} aria-current="page" className={cn(base, "bg-background shadow-sm")}>
                        {tab.label}
                    </span>
                ) : (
                    <Link key={tab.key} href={tab.href} className={cn(base, "text-muted-foreground hover:text-foreground")}>
                        {tab.label}
                    </Link>
                )
            )}
        </nav>
    )
}
