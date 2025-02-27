"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BarChart, BookOpen, Home, Layers, Settings, Users } from "lucide-react"

export function DashboardNav() {
  const pathname = usePathname()

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/projects",
      label: "Projects",
      icon: Layers,
      active: pathname === "/dashboard/projects",
    },
    {
      href: "/dashboard/research",
      label: "Research",
      icon: BookOpen,
      active: pathname === "/dashboard/research",
    },
    {
      href: "/dashboard/analytics",
      label: "Analytics",
      icon: BarChart,
      active: pathname === "/dashboard/analytics",
    },
    {
      href: "/dashboard/team",
      label: "Team",
      icon: Users,
      active: pathname === "/dashboard/team",
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: Settings,
      active: pathname === "/dashboard/settings",
    },
  ]

  return (
    <nav className="hidden border-r bg-muted/40 md:block md:w-64">
      <div className="flex h-full flex-col gap-2 p-4">
        <div className="flex-1 space-y-1">
          {routes.map((route) => (
            <Button
              key={route.href}
              variant={route.active ? "secondary" : "ghost"}
              className={cn("w-full justify-start", route.active ? "bg-secondary" : "hover:bg-muted")}
              asChild
            >
              <Link href={route.href}>
                <route.icon className="mr-2 h-5 w-5" />
                {route.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </nav>
  )
}

