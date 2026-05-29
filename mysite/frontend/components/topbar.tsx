"use client"

import { Bell, Search, Settings, User, Menu } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ColorThemePicker } from "@/components/color-theme"

interface TopbarProps {
  onMenuClick?: () => void
}

type UserProfile = {
  authenticated: boolean
  email: string
  first_name: string
  last_name: string
  phone_number: string
}
type AppNotification = {
  id: number
  title: string
  message: string
  level: "info" | "success" | "warning" | "error"
  source?: string | null
  is_read: boolean
  created_at: string
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const [q, setQ] = useState("")
  const [user, setUser] = useState<UserProfile | null>(null)
  const router = useRouter()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/me/", {
          method: "GET",
          credentials: "include",
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()
        setUser(data)
      } catch (error) {
        console.error("Erreur chargement utilisateur :", error)
      }
    }

    fetchUser()
  }, [])

  const handleLogout = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/logout/", {
        method: "POST",
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        router.push("/signin")
      } else {
        console.error(data.message || "Erreur lors de la déconnexion")
      }
    } catch (error) {
      console.error("Erreur serveur lors de la déconnexion :", error)
    }
  }

  const initials =
    `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase() || "U"

  const signedInName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Utilisateur"


useEffect(() => {
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true)

      const response = await fetch("http://127.0.0.1:8000/data/notifications/", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des notifications")
      }

      const data = await response.json()

      setUnreadCount(data.unread_count || 0)
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error("Erreur notifications :", error)
    } finally {
      setNotificationsLoading(false)
    }
  }

  fetchNotifications()
}, [])

 return (
  <header className="sticky top-0 z-30 mb-6 bg-transparent">
    <div className="flex h-[76px] items-center justify-between gap-4 px-4 md:px-7">
      {/* Bouton menu mobile */}
      <button
        onClick={onMenuClick}
        className="grid h-10 w-10 place-items-center rounded-2xl border bg-[var(--dashboard-card)] text-[var(--dashboard-muted)] transition hover:text-[var(--dashboard-text)] lg:hidden"
        style={{ borderColor: "var(--dashboard-border)" }}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="w-full max-w-[520px]">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dashboard-muted)]" />

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un site, une page ou un indicateur..."
            className="h-12 w-full rounded-2xl border bg-[var(--dashboard-card)] pl-11 pr-4 text-sm font-semibold text-[var(--dashboard-text)] outline-none transition placeholder:text-[var(--dashboard-muted)] focus:border-[var(--brand-primary)]"
            style={{ borderColor: "var(--dashboard-border)" }}
            aria-label="Search"
          />
        </label>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative grid h-11 w-11 place-items-center rounded-2xl border bg-[var(--dashboard-card)] text-[var(--dashboard-muted)] transition hover:text-[var(--dashboard-text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30">
            <Bell className="h-5 w-5" aria-hidden />
            <span className="sr-only">Open notifications</span>

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                {unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-80 rounded-2xl border bg-[var(--dashboard-card)] p-2 text-[var(--dashboard-text)] shadow-xl"
            style={{ borderColor: "var(--dashboard-border)" }}
          >
            <DropdownMenuLabel className="flex items-center justify-between px-2 py-2">
              <span className="text-sm font-black">Notifications</span>

              {unreadCount > 0 && (
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-500">
                  {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {notificationsLoading ? (
              <div className="px-3 py-3 text-sm text-[var(--dashboard-muted)]">
                Chargement...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-3 py-3 text-sm text-[var(--dashboard-muted)]">
                Aucune notification disponible.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => {
                  const levelClass =
                    notification.level === "error"
                      ? "border-l-red-500"
                      : notification.level === "warning"
                      ? "border-l-orange-500"
                      : notification.level === "success"
                      ? "border-l-emerald-500"
                      : "border-l-blue-500"

                  return (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex cursor-default flex-col items-start gap-1 rounded-xl border-l-4 ${levelClass} px-3 py-3 focus:bg-[var(--dashboard-card-soft)]`}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[var(--dashboard-text)]">
                          {notification.title}
                        </span>

                        {!notification.is_read && (
                          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">
                            Nouveau
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-[var(--dashboard-muted)]">
                        {notification.message}
                      </span>

                      <span className="text-[10px] text-[var(--dashboard-muted)]">
                        {new Date(notification.created_at).toLocaleString("fr-FR")}
                      </span>
                    </DropdownMenuItem>
                  )
                })}
              </div>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem className="rounded-xl text-[var(--dashboard-muted)] focus:bg-[var(--dashboard-card-soft)]">
              Voir toutes les notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings */}
        <DropdownMenu>
          <DropdownMenuTrigger className="grid h-11 w-11 place-items-center rounded-2xl border bg-[var(--dashboard-card)] text-[var(--dashboard-muted)] transition hover:text-[var(--dashboard-text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30">
            <Settings className="h-5 w-5" aria-hidden />
            <span className="sr-only">Open settings</span>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-60 rounded-2xl border bg-[var(--dashboard-card)] p-2 text-[var(--dashboard-text)] shadow-xl"
            style={{ borderColor: "var(--dashboard-border)" }}
          >
            <DropdownMenuLabel className="px-2 py-2 text-sm font-black">
              Paramètres
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <button className="w-full rounded-xl px-2 py-2 text-left text-sm font-semibold">
                Manage users
              </button>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <button className="w-full rounded-xl px-2 py-2 text-left text-sm font-semibold">
                Network
              </button>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <div className="px-2 py-2">
              <ThemeToggle />
            </div>

            <div className="px-2 pb-2">
              <ColorThemePicker />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger className="grid h-11 w-11 place-items-center rounded-full bg-[var(--dashboard-card-soft)] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-[var(--dashboard-card-soft)] text-sm font-black text-[var(--dashboard-text)]">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-64 rounded-2xl border bg-[var(--dashboard-card)] p-2 text-[var(--dashboard-text)] shadow-xl"
            style={{ borderColor: "var(--dashboard-border)" }}
          >
            <DropdownMenuLabel className="px-2 py-2">
              <div className="flex items-center gap-3">
                <div
                  className="grid h-10 w-10 place-items-center rounded-full text-sm font-black text-white"
                  style={{ background: "var(--brand-gradient)" }}
                >
                  {initials}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black">
                    {signedInName}
                  </p>
                  <p className="truncate text-xs font-semibold text-[var(--dashboard-muted)]">
                    {user?.email || "Aucun email"}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => router.push("/profile")}
              className="rounded-xl px-2 py-2 text-sm font-semibold focus:bg-[var(--dashboard-card-soft)]"
            >
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-xl px-2 py-2 text-sm font-semibold text-red-500 focus:bg-red-500/10 focus:text-red-500"
            >
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </header>
)}