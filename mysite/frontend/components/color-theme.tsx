"use client"

import { useEffect, useState } from "react"

const THEMES = [
  {
    key: "mobelite",
    label: "Mobelite",
    primary: "#315CFF",
    secondary: "#7B5CFF",
    tertiary: "#F05BD8",
    gradient: "linear-gradient(135deg, #315CFF, #7B5CFF, #F05BD8)",
  },
  {
    key: "ocean",
    label: "Ocean",
    primary: "#18C7E8",
    secondary: "#315CFF",
    tertiary: "#7B5CFF",
    gradient: "linear-gradient(135deg, #18C7E8, #315CFF, #7B5CFF)",
  },
  {
    key: "violet",
    label: "Violet",
    primary: "#7B5CFF",
    secondary: "#A855F7",
    tertiary: "#F05BD8",
    gradient: "linear-gradient(135deg, #7B5CFF, #A855F7, #F05BD8)",
  },
  {
    key: "rose-green",
    label: "Rose Green",
    primary: "#F05BD8",
    secondary: "#8EECC8",
    tertiary: "#18C7E8",
    gradient: "linear-gradient(135deg, #F05BD8, #8EECC8, #18C7E8)",
  },
  {
    key: "mint",
    label: "Mint",
    primary: "#14B8A6",
    secondary: "#18C7E8",
    tertiary: "#315CFF",
    gradient: "linear-gradient(135deg, #14B8A6, #18C7E8, #315CFF)",
  },
] as const

function applyBrandTheme(key: string) {
  const theme = THEMES.find((item) => item.key === key) || THEMES[0]

  document.documentElement.setAttribute("data-brand", theme.key)
  document.documentElement.style.setProperty("--brand-primary", theme.primary)
  document.documentElement.style.setProperty("--brand-secondary", theme.secondary)
  document.documentElement.style.setProperty("--brand-tertiary", theme.tertiary)
  document.documentElement.style.setProperty("--brand-gradient", theme.gradient)
  localStorage.setItem("brand-theme", theme.key)

  return theme.key
}

export function BrandThemeInitializer() {
  useEffect(() => {
    applyBrandTheme(localStorage.getItem("brand-theme") || "mobelite")
  }, [])

  return null
}

export function ColorThemePicker() {
  const [current, setCurrent] = useState<string>("mobelite")

  useEffect(() => {
    const saved = localStorage.getItem("brand-theme") || "mobelite"
applyTheme(saved)
  }, [])

  function applyTheme(key: string) {
  setCurrent(applyBrandTheme(key))
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
            onClick={() => applyTheme(theme.key)}
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
