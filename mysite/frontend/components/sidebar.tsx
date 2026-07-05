"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { SmartSEOLogo } from "./smartseo-logo"
import {
  Home,
  Bell,
  BarChart3,
  BrainCircuit,
  TrendingUp,
  Search,
  Lightbulb,
  Globe,
  UserRound,
  LogOut,
  ShieldCheck,
  MessageCircle,
  type LucideIcon,
} from "lucide-react"

type Item = {
  href: string
  label: string
  icon: LucideIcon
  badge?: string
}

type Section = {
  title: string
  items: Item[]
}

interface SidebarProps {
  onClose?: () => void
}

type UserProfile = {
  authenticated: boolean
  email: string
  first_name: string
  last_name: string
  is_superuser: boolean
}

const sections: Section[] = [
  {
    title: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/ai-insights", label: "AI Insights", icon: BrainCircuit },
      { href: "/chatbot", label: "Assistant IA", icon: MessageCircle },
    ],
  },
  {
    title: "Analyse",
    items: [
      { href: "/analytics", label: "Google Analytics", icon: TrendingUp },
      { href: "/search-console", label: "Search Console", icon: Search },
      
    ],
  },
  {
    title: "Rapports",
    items: [
      { href: "/recommendations", label: "Recommandations", icon: Lightbulb },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Compte",
    items: [
      { href: "/devices", label: "Les sites", icon: Globe },
      { href: "/profile", label: "Profil", icon: UserRound },
      { href: "/signin", label: "Logout", icon: LogOut },
    ],
  },
]

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-open")
    if (saved) setOpen(saved === "1")
  }, [])

  useEffect(() => {
    localStorage.setItem("sidebar-open", open ? "1" : "0")
  }, [open])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/me/", {
          method: "GET",
          credentials: "include",
        })

        if (!response.ok) return

        const data = await response.json()
        setUser(data)
      } catch (error) {
        console.error("Erreur chargement utilisateur :", error)
      }
    }

    fetchUser()
  }, [])

  const userFullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "Admin"
  const userRole = user?.is_superuser ? "Super Admin" : "Admin"
  const userInitial =
    (user?.first_name || user?.email || "A").trim().charAt(0).toUpperCase() ||
    "A"

  return (
    <aside
      className={`relative flex h-full flex-col overflow-hidden py-6 transition-all duration-300 ${
        open ? "w-64 px-5" : "w-20 px-3"
      }`}
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
        boxShadow: "var(--sidebar-shadow)",
      }}
    >
      {/* Logo */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`group relative z-10 mb-5 flex w-full cursor-pointer items-center justify-center rounded-2xl transition duration-200 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
          open ? "px-2 py-1" : "min-h-[52px]"
        }`}
        aria-label={open ? "Réduire le menu" : "Ouvrir le menu"}
        title={open ? "Cliquer pour réduire le menu" : "Cliquer pour ouvrir le menu"}
      >
        {open ? (
          <div className="flex w-full items-center justify-center rounded-2xl px-2 py-1.5 transition duration-200 group-hover:bg-[var(--sidebar-pill-bg)]">
            <SmartSEOLogo className="h-[102px] w-auto max-w-[180px] shrink-0 text-[var(--sidebar-text)]" />
          </div>
        ) : (
          <div className="grid size-11 place-items-center rounded-2xl transition duration-200">
            <SmartSEOLogo compact className="size-11 shrink-0" />
          </div>
        )}
      </button>

      {/* Navigation */}
      <nav className="relative z-10 flex flex-1 flex-col gap-7 overflow-y-auto overflow-x-hidden">
        {sections.map((section) => (
          <div key={section.title}>
            {open ? (
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="h-px flex-1"
                  style={{ background: "var(--sidebar-border)" }}
                />
                <span
                  className="text-[11px] font-black uppercase tracking-[0.22em]"
                  style={{ color: "var(--sidebar-section)" }}
                >
                  {section.title}
                </span>
                <span
                  className="h-px flex-1"
                  style={{ background: "var(--sidebar-border)" }}
                />
              </div>
            ) : (
              <div
                className="mx-auto mb-3 h-px w-8"
                style={{ background: "var(--sidebar-border)" }}
              />
            )}

            <div className="flex flex-col gap-2">
              {section.items.map(({ href, label, icon: Icon, badge }) => {
                const active =
                  pathname === href || pathname?.startsWith(href + "/")
                const hovered = hoveredItem === href
                const isLogout = label === "Logout"

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => onClose?.()}
                    onMouseEnter={() => setHoveredItem(href)}
                    onMouseLeave={() => setHoveredItem(null)}
                    title={!open ? label : undefined}
                    className={`group relative flex h-12 items-center rounded-2xl transition-all duration-200 ${
                      open ? "justify-start gap-4 px-3" : "justify-center"
                    }`}
                    style={{
                      textDecoration: "none",
                      background: active
                        ? "var(--brand-gradient-soft)"
                        : hovered
                        ? "var(--brand-gradient-soft)"
                        : "transparent",
                      border: "1px solid transparent",
                    }}
                  >
                    {/* Barre active */}
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full"
                        style={{ background: "var(--brand-gradient)" }}
                      />
                    )}

                    {/* Icône simple sans carré */}
                    <Icon
                      className="shrink-0 transition-all duration-200"
                      style={{
                        width: hovered || active ? "23px" : "21px",
                        height: hovered || active ? "23px" : "21px",
                        color: isLogout
                          ? "#f87171"
                          : active || hovered
                          ? "var(--brand-primary)"
                          : "var(--sidebar-muted)",
                        strokeWidth: active || hovered ? 2.6 : 2.2,
                      }}
                    />

                    {open && (
                      <>
                        <span
                          className="flex-1 truncate text-sm transition-all duration-200"
                          style={{
                            fontWeight: active ? 800 : hovered ? 700 : 600,
                            color: isLogout
                              ? "#f87171"
                              : active || hovered
                              ? "var(--sidebar-text)"
                              : "var(--sidebar-muted)",
                            transform:
                              hovered && !active ? "scale(1.045)" : "scale(1)",
                            transformOrigin: "left center",
                          }}
                        >
                          {label}
                        </span>

                        {badge && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                            style={{
                              background: "var(--brand-gradient)",
                              boxShadow: "0 6px 16px rgba(15,23,42,0.18)",
                            }}
                          >
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      {open && (
        <div
          className="relative z-10 mt-6 rounded-2xl p-3"
          style={{
            background: "var(--sidebar-pill-bg)",
            border: "1px solid var(--sidebar-border)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="grid size-9 shrink-0 place-items-center rounded-xl text-sm font-black text-white"
              style={{
                background: "var(--brand-gradient)",
              }}
            >
              {userInitial}
            </div>

            <div className="min-w-0">
              <p
                className="truncate text-sm font-black"
                style={{ color: "var(--sidebar-text)" }}
              >
                {userFullName}
              </p>
              <p
                className="truncate text-xs"
                style={{ color: "var(--sidebar-muted)" }}
              >
                {userRole}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
