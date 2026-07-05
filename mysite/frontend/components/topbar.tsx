"use client"

import { Bell, Search, Settings, User, Menu } from "lucide-react"
import { useEffect, useMemo, useState,useRef } from "react"
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
  is_staff: boolean
  is_superuser: boolean
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

type Website = {
  id: number
  name: string
  gsc_site_url?: string | null
  ga4_property_id?: string | null
}

type SearchResult = {
  type: "Page" | "Indicateur" | "Site"
  label: string
  description: string
  href: string
  website?: Website
  keywords: string[]
}

const navigationResults: SearchResult[] = [
  {
    type: "Page",
    label: "Dashboard",
    description: "Vue globale des performances",
    href: "/dashboard",
    keywords: ["dashboard", "accueil", "tableau", "bord", "global"],
  },
  {
    type: "Page",
    label: "AI Insights",
    description: "Analyses IA et recommandations",
    href: "/ai-insights",
    keywords: ["ai", "insights", "ia", "analyse", "recommandations"],
  },
  {
    type: "Page",
    label: "Assistant IA",
    description: "Chatbot SEO",
    href: "/chatbot",
    keywords: ["chatbot", "assistant", "ia", "chat"],
  },
  {
    type: "Page",
    label: "Google Analytics",
    description: "Sessions, utilisateurs et pages vues",
    href: "/analytics",
    keywords: ["analytics", "ga", "sessions", "utilisateurs", "visiteurs"],
  },
  {
    type: "Page",
    label: "Search Console",
    description: "Clics, impressions, CTR et position",
    href: "/search-console",
    keywords: ["search", "console", "gsc", "clics", "impressions", "ctr", "position"],
  },
  {
    type: "Page",
    label: "Gestion des sites",
    description: "Sites connectes et configuration",
    href: "/devices",
    keywords: ["sites", "site", "devices", "gestion", "connexion"],
  },
  {
    type: "Page",
    label: "Notifications",
    description: "Alertes et activites recentes",
    href: "/notifications",
    keywords: ["notifications", "alertes", "alerte"],
  },
  {
    type: "Page",
    label: "Profil",
    description: "Informations du compte",
    href: "/profile",
    keywords: ["profil", "profile", "compte", "utilisateur"],
  },
]

const indicatorResults: SearchResult[] = [
  {
    type: "Indicateur",
    label: "Clics",
    description: "Voir les clics dans Search Console",
    href: "/search-console",
    keywords: ["clic", "clics", "click", "clicks"],
  },
  {
    type: "Indicateur",
    label: "CTR moyen",
    description: "Voir le CTR dans Search Console",
    href: "/search-console",
    keywords: ["ctr", "taux", "clic"],
  },
  {
    type: "Indicateur",
    label: "Position moyenne",
    description: "Voir la position Google moyenne",
    href: "/search-console",
    keywords: ["position", "moyenne", "ranking", "google"],
  },
  {
    type: "Indicateur",
    label: "Sessions",
    description: "Voir les sessions dans Google Analytics",
    href: "/analytics",
    keywords: ["session", "sessions", "trafic", "traffic"],
  },
  {
    type: "Indicateur",
    label: "Pages vues",
    description: "Voir les pages vues dans Google Analytics",
    href: "/analytics",
    keywords: ["pages", "vues", "views", "pageviews"],
  },
]

const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

export function Topbar({ onMenuClick }: TopbarProps) {
  const [q, setQ] = useState("")
  const [user, setUser] = useState<UserProfile | null>(null)
  const [websites, setWebsites] = useState<Website[]>([])
  const [searchFocused, setSearchFocused] = useState(false)
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

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/data/websites/", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        })

        if (!response.ok) return

        const data = await response.json()
        setWebsites(data.websites || [])
      } catch (error) {
        console.error("Erreur chargement sites :", error)
      }
    }

    fetchWebsites()
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

  const searchResults = useMemo(() => {
    const term = normalizeSearchText(q.trim())
    if (term.length < 2) return []

    const siteResults: SearchResult[] = websites.map((website) => ({
      type: "Site",
      label: website.name,
      description: website.gsc_site_url || "Ouvrir ce site",
      href: "/devices",
      website,
      keywords: [
        website.name,
        website.gsc_site_url || "",
        website.ga4_property_id || "",
        "site",
      ],
    }))

    return [...navigationResults, ...indicatorResults, ...siteResults]
      .filter((result) =>
        normalizeSearchText(
          `${result.label} ${result.description} ${result.keywords.join(" ")}`
        ).includes(term)
      )
      .slice(0, 7)
  }, [q, websites])

  const showSearchResults = searchFocused && q.trim().length >= 2

  const openSearchResult = (result: SearchResult) => {
    if (result.website) {
      localStorage.setItem("websiteId", String(result.website.id))
      localStorage.setItem("websiteName", result.website.name)
    }

    setQ("")
    setSearchFocused(false)
    router.push(result.href)
  }


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
      <div className="relative w-full max-w-[520px]">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dashboard-muted)]" />

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && searchResults[0]) {
                openSearchResult(searchResults[0])
              }

              if (event.key === "Escape") {
                setSearchFocused(false)
              }
            }}
            placeholder="Rechercher un site, une page ou un indicateur..."
            className="h-12 w-full rounded-2xl border bg-[var(--dashboard-card)] pl-11 pr-4 text-sm font-semibold text-[var(--dashboard-text)] outline-none transition placeholder:text-[var(--dashboard-muted)] focus:border-[var(--brand-primary)]"
            style={{ borderColor: "var(--dashboard-border)" }}
            aria-label="Search"
          />
        </label>

        {showSearchResults && (
          <div
            className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-2xl border bg-[var(--dashboard-card)] p-2 shadow-2xl"
            style={{ borderColor: "var(--dashboard-border)" }}
            onMouseDown={(event) => event.preventDefault()}
          >
            {searchResults.length > 0 ? (
              searchResults.map((result) => (
                <button
                  key={`${result.type}-${result.label}-${result.href}`}
                  type="button"
                  onClick={() => openSearchResult(result)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-[var(--dashboard-card-soft)]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-[var(--dashboard-text)]">
                      {result.label}
                    </span>
                    <span className="block truncate text-xs font-semibold text-[var(--dashboard-muted)]">
                      {result.description}
                    </span>
                  </span>

                  <span
                    className="shrink-0 rounded-full px-2 py-1 text-[10px] font-black"
                    style={{
                      background:
                        "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
                      color: "var(--brand-primary)",
                    }}
                  >
                    {result.type}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-sm font-semibold text-[var(--dashboard-muted)]">
                Aucun resultat trouve.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative grid h-11 w-11 place-items-center rounded-2xl border bg-[var(--dashboard-card)] text-[var(--dashboard-muted)] transition hover:text-[var(--dashboard-text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30">
            <Bell className="h-5 w-5" aria-hidden />
            <span className="sr-only">Open notifications</span>

            {unreadCount > 0 && (
              <span
                className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black text-white"
                style={{ background: "var(--brand-gradient)" }}
              >
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
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{
                    background:
                      "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
                    color: "var(--brand-primary)",
                  }}
                >
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
                  const levelColor =
                    notification.level === "error"
                      ? "var(--brand-tertiary)"
                      : notification.level === "warning"
                      ? "color-mix(in srgb, var(--brand-secondary) 58%, var(--brand-tertiary))"
                      : notification.level === "success"
                      ? "var(--brand-secondary)"
                      : "var(--brand-primary)"

                  return (
                    <DropdownMenuItem
  key={notification.id}
  onSelect={(event) => {
    event.preventDefault()
    openNotification(notification)
  }}
  className="flex cursor-pointer flex-col items-start gap-1 rounded-xl border-l-4 px-3 py-3 focus:bg-[var(--dashboard-card-soft)]"
  style={{ borderLeftColor: levelColor }}
>
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[var(--dashboard-text)]">
                          {notification.title}
                        </span>

                        {!notification.is_read && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                            style={{ background: "var(--brand-gradient)" }}
                          >
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

            {user?.is_superuser ? (
              <DropdownMenuItem asChild>
                <button
                  type="button"
                  onClick={() => router.push("/profile/accounts")}
                  className="w-full rounded-xl px-2 py-2 text-left text-sm font-semibold"
                >
                  Gestion des admins
                </button>
              </DropdownMenuItem>
            ) : null}

            <DropdownMenuItem asChild>
              <button
                type="button"
                onClick={() => router.push("/devices")}
                className="w-full rounded-xl px-2 py-2 text-left text-sm font-semibold"
              >
                Gestion des sites
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
