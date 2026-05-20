"use client"

import { useEffect, useState } from "react"

const THEMES = [
  {
    key: "mobelite",
    label: "Mobelite",
    gradient: "linear-gradient(135deg, #315CFF, #7B5CFF, #F05BD8)",
  },
  {
    key: "ocean",
    label: "Ocean",
    gradient: "linear-gradient(135deg, #18C7E8, #315CFF, #7B5CFF)",
  },
  {
    key: "violet",
    label: "Violet",
    gradient: "linear-gradient(135deg, #7B5CFF, #A855F7, #F05BD8)",
  },
  {
    key: "rose-green",
    label: "Rose Green",
    gradient: "linear-gradient(135deg, #F05BD8, #8EECC8, #18C7E8)",
  },
  {
    key: "mint",
    label: "Mint",
    gradient: "linear-gradient(135deg, #14B8A6, #18C7E8, #315CFF)",
  },
] as const

export function ColorThemePicker() {
  const [current, setCurrent] = useState<string>("mobelite")

  useEffect(() => {
    const saved = localStorage.getItem("brand-theme") || "mobelite"
    setCurrent(saved)
    document.documentElement.setAttribute("data-brand", saved)
  }, [])

  function setBrand(key: string) {
    setCurrent(key)
    document.documentElement.setAttribute("data-brand", key)
    localStorage.setItem("brand-theme", key)
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-muted-foreground">
        Thème couleur
      </p>

      <div className="flex items-center gap-2">
        {THEMES.map((theme) => (
          <button
            key={theme.key}
            type="button"
            aria-label={`Utiliser le thème ${theme.label}`}
            onClick={() => setBrand(theme.key)}
            className={`relative h-7 w-7 rounded-full transition-all duration-300 ${
              current === theme.key
                ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-background"
                : "ring-1 ring-border hover:scale-105"
            }`}
            style={{ background: theme.gradient }}
          >
            {current === theme.key && (
              <span className="absolute inset-1 rounded-full border-2 border-white/80" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}