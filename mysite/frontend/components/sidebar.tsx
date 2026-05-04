"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Home,
  Bell,
  BarChart3,
  BrainCircuit,
  Globe,
  UserRound,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

type Item = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface SidebarProps {
  onClose?: () => void
}

const items: Item[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/security", label: "AI Insights", icon: BrainCircuit },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/devices", label: "Websites", icon: Globe },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/signin", label: "Logout", icon: LogOut },
]

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-open")
    if (saved) setOpen(saved === "1")
  }, [])

  useEffect(() => {
    localStorage.setItem("sidebar-open", open ? "1" : "0")
  }, [open])

  return (
    <aside
      className={`relative flex h-full flex-col rounded-[2rem] bg-white/70 py-6 shadow-xl backdrop-blur-xl transition-all duration-300 ${
        open ? "w-64 items-stretch px-4" : "w-24 items-center px-0"
      }`}
    >
      <button
        onClick={() => setOpen((value) => !value)}
        className="absolute -right-4 top-8 z-10 grid size-9 place-items-center rounded-full bg-white text-violet-600 shadow-lg transition hover:bg-violet-50"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {open ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
      </button>

      <div
        className={`mb-10 flex items-center ${
          open ? "gap-3" : "justify-center"
        }`}
      >
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-400 text-white shadow-lg">
          <Home className="size-7" />
        </div>

        {open && (
          <div>
            <p className="text-base font-bold text-slate-800">Smart SEO</p>
            <p className="text-xs text-slate-400">Analytics AI</p>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              onClick={() => onClose?.()}
              title={!open ? label : undefined}
              className={`flex h-12 items-center rounded-2xl transition ${
                open ? "justify-start gap-3 px-4" : "justify-center"
              } ${
                active
                  ? "bg-violet-100 text-violet-600 shadow-md"
                  : "text-violet-400 hover:bg-violet-50 hover:text-violet-600"
              }`}
            >
              <Icon className="size-6 shrink-0" />
              {open && <span className="text-sm font-medium">{label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}