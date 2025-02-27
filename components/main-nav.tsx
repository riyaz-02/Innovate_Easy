"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Menu } from "lucide-react"

export function MainNav() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  const routes = [
    {
      href: "/",
      label: "Home",
      active: pathname === "/",
    },
    {
      href: "/about",
      label: "About",
      active: pathname === "/about",
    },
    {
      href: "/contact",
      label: "Contact",
      active: pathname === "/contact",
    },
  ]

  return (
    <div className="flex justify-between items-center py-4 md:py-6">
      <div className="flex items-center gap-6 md:gap-10">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl md:text-2xl">Innovate Easy</span>
        </Link>
        <nav className="hidden md:flex gap-6">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                route.active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {route.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex gap-2">
          <Link href="/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Sign Up</Button>
          </Link>
        </div>
        <ModeToggle />
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>
      {isMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-background border-b z-50 md:hidden animate-in">
          <nav className="flex flex-col p-4 gap-4">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  route.active ? "text-primary" : "text-muted-foreground",
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {route.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="w-full">Sign Up</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}

