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
    <header className="lg:-mx-7 sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border mb-6 rounded-xl lg:rounded-none">
      <div className="h-16 px-4 md:px-7 flex items-center justify-between gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-full p-2 hover:bg-muted focus:outline-none focus:ring-2"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>

        <div className="flex-1 max-w-xl">
          <label className="relative block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="size-4" />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search rooms, devices, or users..."
              className="w-full rounded-full border bg-background pl-9 pr-3 py-2 text-sm"
              aria-label="Search"
            />
          </label>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
  <DropdownMenuTrigger className="relative rounded-full p-2 hover:bg-muted focus:outline-none focus:ring-2">
    <Bell className="size-5" aria-hidden />
    <span className="sr-only">Open notifications</span>

    {unreadCount > 0 && (
      <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
        {unreadCount}
      </span>
    )}
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end" className="w-80">
    <DropdownMenuLabel className="flex items-center justify-between">
      <span>Notifications</span>

      {unreadCount > 0 && (
        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500">
          {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
        </span>
      )}
    </DropdownMenuLabel>

    <DropdownMenuSeparator />

    {notificationsLoading ? (
      <div className="px-3 py-3 text-sm text-muted-foreground">
        Chargement...
      </div>
    ) : notifications.length === 0 ? (
      <div className="px-3 py-3 text-sm text-muted-foreground">
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
              className={`flex cursor-default flex-col items-start gap-1 border-l-4 ${levelClass} px-3 py-3`}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-sm font-semibold">
                  {notification.title}
                </span>

                {!notification.is_read && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    Nouveau
                  </span>
                )}
              </div>

              <span className="text-xs text-muted-foreground">
                {notification.message}
              </span>

              <span className="text-[10px] text-muted-foreground">
                {new Date(notification.created_at).toLocaleString("fr-FR")}
              </span>
            </DropdownMenuItem>
          )
        })}
      </div>
    )}

    <DropdownMenuSeparator />

    <DropdownMenuItem className="text-muted-foreground">
      Voir toutes les notifications
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full p-2 hover:bg-muted focus:outline-none focus:ring-2">
              <Settings className="size-5" aria-hidden />
              <span className="sr-only">Open settings</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <button className="w-full text-left">Manage users</button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <button className="w-full text-left">Network</button>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <ThemeToggle />
              </div>
              <div className="px-2 pb-2">
                <ColorThemePicker />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full p-1.5 hover:bg-muted focus:outline-none focus:ring-2">
              <Avatar className="size-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Open user menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                <User className="size-4" />
                Signed in as {signedInName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/profile">Profile</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/devices">My devices</a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive cursor-pointer"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}