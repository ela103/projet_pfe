"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

function OAuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState("Connexion en cours...")

  useEffect(() => {
    const error = searchParams.get("error")
    const access = searchParams.get("access")
    const refresh = searchParams.get("refresh")

    if (error) {
      setMessage(error)
      window.setTimeout(() => {
        router.replace("/signin")
      }, 2500)
      return
    }

    if (!access || !refresh) {
      setMessage("La connexion OAuth est incomplète.")
      window.setTimeout(() => {
        router.replace("/signin")
      }, 2500)
      return
    }

    localStorage.setItem("access_token", access)
    localStorage.setItem("refresh_token", refresh)

    router.replace("/dashboard")
    router.refresh()
  }, [router, searchParams])

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 shadow-2xl backdrop-blur">
      <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />
      <span className="text-sm font-semibold">{message}</span>
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#120f2b] px-6 text-white">
      <Suspense
        fallback={
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 shadow-2xl backdrop-blur">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />
            <span className="text-sm font-semibold">Connexion en cours...</span>
          </div>
        }
      >
        <OAuthCallbackContent />
      </Suspense>
    </main>
  )
}
