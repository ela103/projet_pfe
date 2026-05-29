"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
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
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
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

const sections: Section[] = [
  {
    title: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/statistics", label: "Statistics", icon: BarChart3 },
      { href: "/ai-insights", label: "AI Insights", icon: BrainCircuit, badge: "AI" },
    ],
  },
  {
    title: "Analyse",
    items: [
      { href: "/analytics", label: "Google Analytics", icon: TrendingUp },
      { href: "/search-console", label: "Search Console", icon: Search },
      { href: "/scraping", label: "Scraping SEO", icon: ShieldCheck },
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
      { href: "/devices", label: "Mes sites", icon: Globe },
      { href: "/profile", label: "Profil", icon: UserRound },
      { href: "/signin", label: "Logout", icon: LogOut },
    ],
  },
]

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-open")
    if (saved) setOpen(saved === "1")
  }, [])

  useEffect(() => {
    localStorage.setItem("sidebar-open", open ? "1" : "0")
  }, [open])

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
      {/* Toggle */}
<button
  type="button"
  onClick={() => setOpen((v) => !v)}
  className="absolute right-4 top-6 z-30 grid h-8 w-8 place-items-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
  style={{
    background: "color-mix(in srgb, var(--brand-primary) 18%, transparent)",
    border: "1px solid color-mix(in srgb, var(--brand-primary) 35%, transparent)",
    color: "var(--brand-primary)",
  }}
  aria-label={open ? "Réduire le menu" : "Ouvrir le menu"}
  title={open ? "Réduire" : "Ouvrir"}
>
  {open ? (
    <ChevronLeft className="h-4 w-4" strokeWidth={3} />
  ) : (
    <ChevronRight className="h-4 w-4" strokeWidth={3} />
  )}
</button>


      {/* Logo */}
      <div
        className={`relative z-10 mb-8 flex items-center ${
          open ? "gap-3" : "justify-center"
        }`}
      >
        <div
          className="grid size-11 shrink-0 place-items-center rounded-2xl"
          style={{
            background: "var(--brand-gradient)",
            boxShadow: "0 10px 24px rgba(15,23,42,0.18)",
          }}
        >
          <Sparkles className="size-5 text-white" />
        </div>

        {open && (
          <div className="overflow-hidden">
            <p
              className="text-lg font-black leading-none"
              style={{
                background: "var(--brand-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Smart SEO
            </p>
            <p
              className="mt-1 text-xs font-medium"
              style={{ color: "var(--sidebar-muted)" }}
            >
              Analytics AI
            </p>
          </div>
        )}
      </div>

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
                        ? "var(--sidebar-hover)"
                        : "transparent",
                      border: active
                        ? "1px solid var(--sidebar-border)"
                        : "1px solid transparent",
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
              A
            </div>

            <div className="min-w-0">
              <p
                className="truncate text-sm font-black"
                style={{ color: "var(--sidebar-text)" }}
              >
                Admin
              </p>
              <p
                className="truncate text-xs"
                style={{ color: "var(--sidebar-muted)" }}
              >
                SEO Manager
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}