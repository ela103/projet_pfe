"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import {
  AlertTriangle, Bell, Lock, LogOut,
  Mail, Phone, ShieldCheck, User,
  MapPin, Calendar, Edit3, Check,
  TrendingUp, BarChart3, Globe, Star,
} from "lucide-react"

type UserProfile = {
  authenticated: boolean
  email: string
  first_name: string
  last_name: string
  phone_number: string
}

// ── Palette Mobelite ─────────────────────────────────────────
const G = {
  vb : "linear-gradient(135deg, #7B6EF6 0%, #4EAAF0 100%)",
  bc : "linear-gradient(135deg, #4EAAF0 0%, #43E3C8 100%)",
  pm : "linear-gradient(135deg, #E879C8 0%, #A8EDD4 100%)",
  vp : "linear-gradient(135deg, #7B6EF6 0%, #E879C8 100%)",
  full: "linear-gradient(135deg, #7B6EF6 0%, #4EAAF0 40%, #43E3C8 70%, #E879C8 100%)",
}

// ── Stat card ────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, gradient, glow }: {
  label: string; value: string; icon: any; gradient: string; glow: string
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "18px", padding: "18px 20px",
      display: "flex", alignItems: "center", gap: "14px",
      backdropFilter: "blur(10px)",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "default",
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"
      ;(e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${glow}`
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.transform = "translateY(0)"
      ;(e.currentTarget as HTMLElement).style.boxShadow = "none"
    }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: "13px", flexShrink: 0,
        background: gradient,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 6px 18px ${glow}`,
      }}>
        <Icon style={{ width: 18, height: 18, color: "white" }}/>
      </div>
      <div>
        <p style={{ fontSize: "20px", fontWeight: 800, color: "white", margin: 0, lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", margin: "3px 0 0" }}>{label}</p>
      </div>
    </div>
  )
}

// ── Info row ─────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string; color: string
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "12px 16px", borderRadius: "14px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      marginBottom: "8px",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: "10px", flexShrink: 0,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: 15, height: 15, color }}/>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
        <p style={{ fontSize: "13px", color: "white", fontWeight: 500, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
      </div>
    </div>
  )
}

// ── Preference row ───────────────────────────────────────────
function PreferenceRow({ label, sub, checked, onChange, color }: {
  label: string; sub: string; checked: boolean; onChange: (v: boolean) => void; color: string
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 16px", borderRadius: "16px",
      background: checked ? `${color}0C` : "rgba(255,255,255,0.03)",
      border: `1px solid ${checked ? color + "25" : "rgba(255,255,255,0.06)"}`,
      marginBottom: "8px",
      transition: "all 0.2s",
    }}>
      <div>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "white", margin: 0 }}>{label}</p>
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>{sub}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange}/>
    </div>
  )
}

// ── Security button ──────────────────────────────────────────
function SecurityBtn({ icon: Icon, label, sub, danger = false }: {
  icon: any; label: string; sub: string; danger?: boolean
}) {
  return (
    <button style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "14px 16px", borderRadius: "16px", width: "100%",
      background: danger ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${danger ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)"}`,
      cursor: "pointer", textAlign: "left",
      marginBottom: "8px",
      transition: "all 0.2s",
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.background = danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.06)"
      ;(e.currentTarget as HTMLElement).style.transform = "translateX(3px)"
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.background = danger ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)"
      ;(e.currentTarget as HTMLElement).style.transform = "translateX(0)"
    }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: "11px", flexShrink: 0,
        background: danger ? "rgba(239,68,68,0.12)" : "rgba(123,110,246,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: 16, height: 16, color: danger ? "#f87171" : "#a78bfa" }}/>
      </div>
      <div>
        <p style={{ fontSize: "13px", fontWeight: 600, color: danger ? "#f87171" : "white", margin: 0 }}>{label}</p>
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>{sub}</p>
      </div>
      <div style={{ marginLeft: "auto", color: "rgba(255,255,255,0.2)", fontSize: "16px" }}>›</div>
    </button>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function ProfilePage() {
  const [seoNotifications, setSeoNotifications] = useState(true)
  const [anomalyAlerts,    setAnomalyAlerts]    = useState(true)
  const [weeklyReports,    setWeeklyReports]    = useState(false)
  const [emailDigest,      setEmailDigest]      = useState(true)

  const [user,    setUser]    = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const res  = await fetch("http://127.0.0.1:8000/api/me/", { credentials: "include" })
        const data = await res.json()
        if (!res.ok || !data.authenticated) { setError("Impossible de récupérer le profil."); return }
        setUser(data)
      } catch { setError("Erreur de connexion.") }
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#0B0F1E" }}>
      <div style={{
        background: G.vb, borderRadius: "16px", padding: "20px 32px",
        boxShadow: "0 8px 32px rgba(123,110,246,0.4)",
      }}>
        <p style={{ color: "white", fontWeight: 600, margin: 0 }}>Chargement du profil...</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#0B0F1E" }}>
      <div style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(239,68,68,0.3)",
        borderRadius: "20px", padding: "32px", textAlign: "center",
      }}>
        <AlertTriangle style={{ width:32, height:32, color:"#f87171", margin:"0 auto 12px" }}/>
        <p style={{ color:"#f87171", fontWeight:600, margin:0 }}>{error}</p>
      </div>
    </div>
  )

  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Administrateur"
  const initials = `${user?.first_name?.[0]||""}${user?.last_name?.[0]||""}`.toUpperCase() || "AD"

  return (
    <div style={{ minHeight:"100vh", background:"#0B0F1E", padding:"0 0 40px" }}>

      {/* ── Hero Banner ── */}
      <div style={{
        background: G.full,
        padding: "40px 32px 80px",
        position: "relative", overflow: "hidden",
        marginBottom: "0",
      }}>
        {/* Decorative blobs */}
        <div style={{ position:"absolute", top:"-60px", right:"-40px", width:"280px", height:"280px", borderRadius:"50%", background:"rgba(255,255,255,0.1)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:"-80px", left:"20%", width:"200px", height:"200px", borderRadius:"50%", background:"rgba(255,255,255,0.08)", pointerEvents:"none" }}/>

        <div style={{ position:"relative", zIndex:1 }}>
          <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.7)", letterSpacing:"0.15em", textTransform:"uppercase", margin:"0 0 6px" }}>
            Mon espace
          </p>
          <h1 style={{ fontSize:"28px", fontWeight:800, color:"white", margin:0 }}>
            Profil
          </h1>
        </div>
      </div>

      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"0 24px" }}>

        {/* ── Avatar card (chevauchement) ── */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px", padding: "28px",
          marginTop: "-48px", position: "relative", zIndex: 10,
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap",
          marginBottom: "20px",
        }}>

          {/* Avatar avec ring dégradé */}
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{
              position: "absolute", inset: "-4px", borderRadius: "50%",
              background: G.full, zIndex: 0,
              boxShadow: "0 8px 32px rgba(123,110,246,0.5)",
            }}/>
            <div style={{ position:"relative", zIndex:1 }}>
              <Avatar style={{ width:88, height:88 } as any}>
                <AvatarFallback style={{
                  background: G.vb,
                  fontSize: "28px", fontWeight: 800, color: "white",
                } as any}>
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            {/* Status badge */}
            <div style={{
              position:"absolute", bottom:4, right:4, zIndex:2,
              width:18, height:18, borderRadius:"50%",
              background:"#43E3C8",
              border:"2px solid #0B0F1E",
              boxShadow:"0 0 8px rgba(67,227,200,0.8)",
            }}/>
          </div>

          {/* Name + role */}
          <div style={{ flex:1, minWidth:"160px" }}>
            <h2 style={{ fontSize:"22px", fontWeight:800, color:"white", margin:"0 0 4px" }}>
              {fullName}
            </h2>
            <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
              <div style={{
                fontSize:"11px", fontWeight:600, padding:"3px 10px", borderRadius:"99px",
                background: G.vb, color:"white",
              }}>
                Administrateur
              </div>
              <div style={{
                fontSize:"11px", color:"rgba(255,255,255,0.4)",
                display:"flex", alignItems:"center", gap:"4px",
              }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#43E3C8" }}/>
                En ligne
              </div>
            </div>
          </div>

          {/* Edit button */}
          <button style={{
            display:"flex", alignItems:"center", gap:"7px",
            background: G.vb, border:"none", borderRadius:"14px",
            padding:"10px 18px", cursor:"pointer", color:"white",
            fontSize:"13px", fontWeight:600,
            boxShadow:"0 6px 18px rgba(123,110,246,0.45)",
            transition:"opacity 0.2s, transform 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity="0.88"; (e.currentTarget as HTMLElement).style.transform="translateY(-1px)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity="1"; (e.currentTarget as HTMLElement).style.transform="translateY(0)" }}
          >
            <Edit3 style={{ width:14, height:14 }}/> Modifier
          </button>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"14px", marginBottom:"20px" }}>
          <StatCard label="Sites analysés"  value="5"   icon={Globe}      gradient={G.vb} glow="rgba(123,110,246,0.3)"/>
          <StatCard label="Sessions totales" value="24K" icon={TrendingUp}  gradient={G.bc} glow="rgba(78,170,240,0.3)"/>
          <StatCard label="Recommandations"  value="14"  icon={Star}        gradient={G.pm} glow="rgba(232,121,200,0.3)"/>
          <StatCard label="Rapports générés" value="38"  icon={BarChart3}   gradient={G.vp} glow="rgba(123,110,246,0.3)"/>
        </div>

        {/* ── Grid infos + préférences ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" }}>

          {/* Informations personnelles */}
          <div style={{
            background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:"22px", padding:"22px", backdropFilter:"blur(10px)",
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"18px" }}>
              <p style={{ fontSize:"14px", fontWeight:700, color:"white", margin:0 }}>
                Informations personnelles
              </p>
              <div style={{
                width:30, height:30, borderRadius:"9px", background:G.vb,
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 4px 10px rgba(123,110,246,0.4)",
              }}>
                <User style={{ width:14, height:14, color:"white" }}/>
              </div>
            </div>

            <InfoRow icon={User}     label="Nom complet"  value={fullName}                   color="#7B6EF6"/>
            <InfoRow icon={Mail}     label="Adresse email" value={user?.email || "—"}         color="#4EAAF0"/>
            <InfoRow icon={Phone}    label="Téléphone"     value={user?.phone_number || "—"}  color="#43E3C8"/>
            <InfoRow icon={MapPin}   label="Plateforme"    value="Smart SEO Intelligence"     color="#E879C8"/>
            <InfoRow icon={Calendar} label="Rôle"          value="Administrateur SEO"         color="#A8EDD4"/>
          </div>

          {/* Préférences */}
          <div style={{
            background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:"22px", padding:"22px", backdropFilter:"blur(10px)",
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"18px" }}>
              <p style={{ fontSize:"14px", fontWeight:700, color:"white", margin:0 }}>
                Préférences
              </p>
              <div style={{
                width:30, height:30, borderRadius:"9px", background:G.bc,
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 4px 10px rgba(78,170,240,0.4)",
              }}>
                <Bell style={{ width:14, height:14, color:"white" }}/>
              </div>
            </div>

            <PreferenceRow
              label="Notifications SEO"
              sub="Recevoir les alertes de performance"
              checked={seoNotifications}
              onChange={setSeoNotifications}
              color="#7B6EF6"
            />
            <PreferenceRow
              label="Alertes anomalies"
              sub="Détection automatique des variations"
              checked={anomalyAlerts}
              onChange={setAnomalyAlerts}
              color="#4EAAF0"
            />
            <PreferenceRow
              label="Rapports hebdomadaires"
              sub="Résumé envoyé chaque lundi"
              checked={weeklyReports}
              onChange={setWeeklyReports}
              color="#43E3C8"
            />
            <PreferenceRow
              label="Digest email"
              sub="Résumé quotidien par email"
              checked={emailDigest}
              onChange={setEmailDigest}
              color="#E879C8"
            />
          </div>
        </div>

        {/* ── Sécurité ── */}
        <div style={{
          background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
          borderRadius:"22px", padding:"22px", backdropFilter:"blur(10px)",
        }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"18px" }}>
            <p style={{ fontSize:"14px", fontWeight:700, color:"white", margin:0 }}>
              Sécurité du compte
            </p>
            <div style={{
              width:30, height:30, borderRadius:"9px", background:G.pm,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 4px 10px rgba(232,121,200,0.4)",
            }}>
              <ShieldCheck style={{ width:14, height:14, color:"white" }}/>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"0" }}>
            <SecurityBtn icon={Lock}       label="Changer le mot de passe"  sub="Dernière modification il y a 30 jours"/>
            <SecurityBtn icon={ShieldCheck}label="Vérification du compte"   sub="Compte vérifié et sécurisé"/>
            <SecurityBtn icon={LogOut}     label="Déconnexion sécurisée"    sub="Terminer la session en cours" danger/>
          </div>
        </div>

      </div>
    </div>
  )
}