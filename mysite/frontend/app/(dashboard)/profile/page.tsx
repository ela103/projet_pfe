"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { useEffect, useState } from "react"

type UserProfile = {
  authenticated: boolean
  email: string
  first_name: string
  last_name: string
  phone_number: string
}

export default function ProfilePage() {
  const [notifications, setNotifications] = useState(true)
  const [energySaving, setEnergySaving] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/me/", {
          method: "GET",
          credentials: "include",
           
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || "Impossible de charger le profil.")
        }

        setUser(data)
      } catch (err: any) {
        setError(err.message || "Une erreur est survenue.")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const initials =
    `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase() || "U"

  const fullName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Utilisateur"

  if (loading) {
    return (
      <section className="rounded-2xl bg-card p-6 md:p-8 shadow-sm ring-1 ring-border">
        <p className="text-foreground">Chargement du profil...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-2xl bg-card p-6 md:p-8 shadow-sm ring-1 ring-border">
        <p className="text-red-500">{error}</p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl bg-card p-6 md:p-8 shadow-sm ring-1 ring-border">
      <h1 className="text-balance text-2xl font-semibold text-foreground">Profile</h1>
      <p className="mt-2 text-muted-foreground">Manage your profile, preferences, and account.</p>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="rounded-xl bg-background p-4 ring-1 ring-border">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{fullName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">{user?.phone_number}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-background p-4 ring-1 ring-border">
          <h3 className="mb-3 font-medium text-foreground">Preferences</h3>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-foreground">Notifications</span>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-foreground">Energy-saving mode</span>
            <Switch checked={energySaving} onCheckedChange={setEnergySaving} />
          </div>
        </div>

        <div className="rounded-xl bg-background p-4 ring-1 ring-border">
          <h3 className="mb-3 font-medium text-foreground">Shortcuts</h3>
          <ul className="grid grid-cols-2 gap-3 text-sm">
            <li className="rounded-lg bg-primary/10 p-3 text-primary">Good Morning</li>
            <li className="rounded-lg bg-primary/10 p-3 text-primary">Good Night</li>
            <li className="rounded-lg bg-primary/10 p-3 text-primary">Away</li>
            <li className="rounded-lg bg-primary/10 p-3 text-primary">Movie Time</li>
          </ul>
        </div>
      </div>
    </section>
  )
}