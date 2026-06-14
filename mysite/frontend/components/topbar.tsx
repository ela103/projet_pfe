"use client"

import { Bell, Search, Settings, User, Menu } from "lucide-react"
import { useEffect, useState,useRef } from "react"
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
import { toast } from "@/hooks/use-toast"

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
  
  const knownNotificationIds = useRef<Set<number>>(new Set())
  const firstNotificationLoad = useRef(true)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [selectedNotification, setSelectedNotification] =
  useState<AppNotification | null>(null)


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

      const response = await fetch(
        "http://127.0.0.1:8000/data/notifications/",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      )

      if (!response.ok) {
        throw new Error(
          "Erreur lors du chargement des notifications"
        )
      }

      const data = await response.json()

      const incomingNotifications: AppNotification[] =
        data.notifications || []

      setUnreadCount(data.unread_count || 0)
      setNotifications(incomingNotifications)

      // Premier chargement :
      // mémoriser les notifications existantes sans popup.
      if (firstNotificationLoad.current) {
        incomingNotifications.forEach((notification) => {
          knownNotificationIds.current.add(notification.id)
        })

        firstNotificationLoad.current = false
        return
      }

      // Détecter seulement les nouvelles notifications.
      const newNotifications = incomingNotifications.filter(
        (notification) =>
          !knownNotificationIds.current.has(notification.id)
      )

      newNotifications.forEach((notification) => {
        toast({
          variant:
            notification.level === "error"
              ? "destructive"
              : "default",
          title: notification.title,
          description: notification.message,
        })

        knownNotificationIds.current.add(notification.id)
      })
    } catch (error) {
      console.error("Erreur notifications :", error)
    } finally {
      setNotificationsLoading(false)
    }
  }

  fetchNotifications()

  // Vérifier les nouvelles notifications toutes les 10 secondes.
  const intervalId = window.setInterval(
    fetchNotifications,
    10000
  )

  return () => {
    window.clearInterval(intervalId)
  }
}, [])

const openNotification = async (
  notification: AppNotification
) => {
  setSelectedNotification(notification)

  if (notification.is_read) {
    return
  }

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/data/notifications/${notification.id}/read/`,
      {
        method: "POST",
        credentials: "include",
      }
    )

    const data = await response.json()

    if (!response.ok || !data.success) {
      console.error(
        data.message ||
          "Impossible de marquer la notification comme lue."
      )
      return
    }

    setNotifications((currentNotifications) =>
      currentNotifications.map((item) =>
        item.id === notification.id
          ? {
              ...item,
              is_read: true,
            }
          : item
      )
    )

    setSelectedNotification((currentNotification) =>
      currentNotification?.id === notification.id
        ? {
            ...currentNotification,
            is_read: true,
          }
        : currentNotification
    )

    setUnreadCount(data.unread_count ?? 0)
    window.dispatchEvent(
  new CustomEvent("notification-read", {
    detail: {
      notificationId: notification.id,
      unreadCount: data.unread_count ?? 0,
    },
  })
)
  } catch (error) {
    console.error(
      "Erreur pendant la lecture de la notification :",
      error
    )
  }
}

 return (
  <>
    <header className="relative z-30 mb-6 bg-transparent">
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
  onSelect={(event) => {
    event.preventDefault()
    openNotification(notification)
  }}
  className={`flex cursor-pointer flex-col items-start gap-1 rounded-xl border-l-4 ${levelClass} px-3 py-3 focus:bg-[var(--dashboard-card-soft)]`}
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

                      <span className="line-clamp-2 text-xs leading-5 text-[var(--dashboard-muted)]">
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

            <DropdownMenuItem
  onSelect={() => router.push("/notifications")}
  className="cursor-pointer rounded-xl text-[var(--dashboard-muted)] focus:bg-[var(--dashboard-card-soft)]"
>
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

    {selectedNotification && (
      <div
        className="
          fixed inset-0 z-[200]
          flex items-center justify-center
          bg-black/60 p-4 backdrop-blur-sm
        "
        onClick={() => setSelectedNotification(null)}
      >
        <div
          className="
            max-h-[85vh] w-full max-w-2xl
            overflow-y-auto rounded-[28px]
            border p-6 shadow-2xl
          "
          style={{
            background: "var(--dashboard-card)",
            borderColor: "var(--dashboard-border)",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                className="text-xl font-black"
                style={{
                  color: "var(--dashboard-text)",
                }}
              >
                {selectedNotification.title}
              </h2>

              <p
                className="mt-2 text-xs font-semibold"
                style={{
                  color: "var(--dashboard-muted)",
                }}
              >
                {new Date(
                  selectedNotification.created_at
                ).toLocaleString("fr-FR")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedNotification(null)}
              className="
                grid h-10 w-10 shrink-0
                place-items-center rounded-full
                text-xl font-bold transition
                hover:opacity-70
              "
              style={{
                background: "var(--dashboard-card-soft)",
                color: "var(--dashboard-text)",
              }}
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          <div
            className="mt-6 rounded-[20px] border p-5"
            style={{
              background: "var(--dashboard-card-soft)",
              borderColor: "var(--dashboard-border)",
            }}
          >
            <p
              className="whitespace-pre-wrap text-sm leading-7"
              style={{
                color: "var(--dashboard-text)",
              }}
            >
              {selectedNotification.message}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {selectedNotification.source && (
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  background:
                    "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
                  color: "var(--brand-primary)",
                }}
              >
                {selectedNotification.source}
              </span>
            )}

            <span
              className="rounded-full px-3 py-1 text-xs font-bold"
              style={{
                background: "var(--dashboard-card-soft)",
                color: "var(--dashboard-muted)",
              }}
            >
              {selectedNotification.level}
            </span>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setSelectedNotification(null)}
              className="
                rounded-2xl px-5 py-3
                text-sm font-black text-white
              "
              style={{
                background: "var(--brand-primary)",
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    )}
  </>
)
}
