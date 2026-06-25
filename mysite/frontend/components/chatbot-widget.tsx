"use client"

import { useEffect, useRef, useState } from "react"
import { MessageCircle, X, Send, ArrowLeft, Minus } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [screen, setScreen] = useState<"welcome" | "chat">("welcome")

  const [messages, setMessages] = useState([
    {
      role: "bot",
      content: "Bonjour 👋 Je suis votre assistant SEO. Comment puis-je vous aider ?",
    },
  ])

  const [input, setInput] = useState("")
  const [websiteId, setWebsiteId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const storedId = localStorage.getItem("websiteId")
    if (storedId) {
      setWebsiteId(Number(storedId))
    }
  }, [])

  const handleOpen = () => {
  const storedId = localStorage.getItem("websiteId")
  if (storedId) {
    setWebsiteId(Number(storedId))
  }

  setOpen(true)

  if (messages.length > 1) {
    setScreen("chat")
  } else {
    setScreen("welcome")
  }
}

  const handleClose = () => {
    setOpen(false)
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    const currentInput = input

    const userMessage = {
      role: "user",
      content: currentInput,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    try {
      const currentWebsiteId = localStorage.getItem("websiteId")
      console.log("Website ID envoyé :", currentWebsiteId)

  const response = await fetch("http://127.0.0.1:8000/ai/chat/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
  body: JSON.stringify({
    question: currentInput,
    website_id: currentWebsiteId,
    channel: "chatbot",
   
  }),
})
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur backend")
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: data.response?.text || "Aucune réponse reçue.",
        },
      ])
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: error.message || "Erreur lors de la connexion au backend.",
        },
      ])
    }
  }
  useEffect(() => {
  if (open && screen === "chat") {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      })
    }, 100)
  }
}, [open, screen, messages])

  return (
    <>
      <button
        onClick={() => {
          if (open) {
            handleClose()
          } else {
            handleOpen()
          }
        }}
        className="fixed bottom-6 right-6 z-50 rounded-full p-4 text-white shadow-lg transition hover:scale-105"
        style={{
          backgroundColor: "var(--brand-primary)",
          backgroundImage: "var(--brand-gradient)",
          boxShadow:
            "0 14px 34px color-mix(in srgb, var(--brand-primary) 36%, transparent)",
        }}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[340px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[var(--dashboard-card)] shadow-2xl">
          {screen === "welcome" && (
            <div className="relative flex h-full flex-col items-center justify-between overflow-hidden rounded-3xl bg-[var(--dashboard-card)] px-6 pb-5 pt-7 text-white">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at top left, color-mix(in srgb, var(--brand-primary) 38%, transparent), transparent 30%), radial-gradient(circle at top right, color-mix(in srgb, var(--brand-secondary) 28%, transparent), transparent 30%), radial-gradient(circle at bottom left, color-mix(in srgb, var(--brand-tertiary) 22%, transparent), transparent 32%), linear-gradient(180deg, color-mix(in srgb, var(--dashboard-card) 70%, #050312), #050312)",
                }}
              />

              <div className="absolute -left-12 top-16 h-32 w-32 animate-pulse rounded-full bg-[var(--brand-primary)]/20 blur-3xl" />
              <div className="absolute right-0 top-24 h-24 w-24 animate-pulse rounded-full bg-[var(--brand-secondary)]/20 blur-3xl" />
              <div className="absolute bottom-24 left-0 h-28 w-28 animate-pulse rounded-full bg-[var(--brand-tertiary)]/20 blur-3xl" />
              <div className="absolute bottom-10 right-8 h-36 w-36 animate-pulse rounded-full bg-[var(--brand-primary)]/20 blur-3xl" />

              <div className="absolute left-1/2 top-[43%] h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
              <div className="absolute left-1/2 top-[43%] h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--brand-primary)]/15" />
              <div className="absolute left-1/2 top-[43%] h-[295px] w-[295px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--brand-secondary)]/15" />

              <div className="absolute left-8 top-24 h-4 w-4 animate-[floatUp_6s_ease-in-out_infinite] rounded-full bg-[var(--brand-secondary)]/80 shadow-[0_0_18px_color-mix(in_srgb,var(--brand-secondary)_80%,transparent)]" />
              <div className="absolute right-10 top-40 h-3 w-3 animate-[floatUp_7s_ease-in-out_infinite] rounded-full bg-[var(--brand-tertiary)]/80 shadow-[0_0_18px_color-mix(in_srgb,var(--brand-tertiary)_80%,transparent)] [animation-delay:1s]" />
              <div className="absolute left-14 bottom-44 h-5 w-5 animate-[floatUp_8s_ease-in-out_infinite] rounded-full bg-[var(--brand-primary)]/80 shadow-[0_0_20px_color-mix(in_srgb,var(--brand-primary)_80%,transparent)] [animation-delay:2s]" />
              <div className="absolute right-16 bottom-36 h-4 w-4 animate-[floatUp_6.5s_ease-in-out_infinite] rounded-full bg-[var(--brand-secondary)]/80 shadow-[0_0_20px_color-mix(in_srgb,var(--brand-secondary)_80%,transparent)] [animation-delay:1.5s]" />
              <div className="absolute left-1/2 top-20 h-2.5 w-2.5 animate-[floatUp_7.5s_ease-in-out_infinite] rounded-full bg-white/80 shadow-[0_0_14px_rgba(255,255,255,0.8)] [animation-delay:0.8s]" />

              <div className="absolute left-12 top-16 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.95)] animate-pulse" />
              <div className="absolute right-20 top-20 h-1 w-1 animate-pulse rounded-full bg-[var(--brand-secondary)] shadow-[0_0_10px_color-mix(in_srgb,var(--brand-secondary)_85%,transparent)] [animation-delay:0.8s]" />
              <div className="absolute left-20 top-52 h-1 w-1 animate-pulse rounded-full bg-[var(--brand-tertiary)] shadow-[0_0_10px_color-mix(in_srgb,var(--brand-tertiary)_85%,transparent)] [animation-delay:1.3s]" />
              <div className="absolute right-12 bottom-52 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.95)] animate-pulse [animation-delay:1.7s]" />
              <div className="absolute left-10 bottom-28 h-1 w-1 animate-pulse rounded-full bg-[var(--brand-primary)] shadow-[0_0_10px_color-mix(in_srgb,var(--brand-primary)_85%,transparent)] [animation-delay:0.5s]" />

              <button
                onClick={handleClose}
                className="absolute right-4 top-4 z-20 rounded-full bg-white/10 p-2 text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <X size={18} />
              </button>

              <div
                className="relative z-10 rounded-full border border-white/10 px-4 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur-md"
                style={{
                  background:
                    "color-mix(in srgb, var(--brand-primary) 28%, transparent)",
                  boxShadow:
                    "0 0 25px color-mix(in srgb, var(--brand-primary) 25%, transparent)",
                }}
              >
                Assistant IA personnel
              </div>

              <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center py-2">
                <div className="absolute h-52 w-52 rounded-full bg-[var(--brand-primary)]/20 blur-3xl" />
                <img
                  src="/robot.png"
                  alt="AI Robot"
                  className="relative z-10 max-h-[255px] w-auto object-contain"
                  style={{
                    filter:
                      "drop-shadow(0 0 40px color-mix(in srgb, var(--brand-primary) 38%, transparent))",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              </div>

              <div className="relative z-10 mb-4 max-w-[320px] text-center">
                <h2 className="text-[31px] font-extrabold leading-[1.22] tracking-tight">
                  Comment puis-je vous aider aujourd'hui ?
                </h2>
              </div>

              <button
                onClick={() => setScreen("chat")}
                className="relative z-10 w-full rounded-[22px] px-4 py-4 text-base font-bold text-white transition hover:scale-[1.02]"
                style={{
                  background: "var(--brand-gradient)",
                  boxShadow:
                    "0 0 20px color-mix(in srgb, var(--brand-primary) 45%, transparent)",
                }}
              >
                Commencer
              </button>
            </div>
          )}

          {screen === "chat" && (
            <>
              <div
                className="flex items-center justify-between px-4 py-4 text-white"
                style={{ background: "var(--brand-gradient)" }}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setScreen("welcome")}
                    className="rounded-full bg-white/10 p-2 hover:bg-white/20"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  <div>
                    <h3 className="text-sm font-semibold">Assistant IA</h3>
                    <p className="text-xs text-white/80">Assistant SEO intelligent</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
        <button
    type="button"
    onClick={handleClose}
    className="rounded-full p-1 hover:bg-white/15"
    title="Minimiser"
  >
    <Minus size={18} />
  </button>

  <button
    type="button"
    onClick={handleClose}
    className="rounded-full p-1 hover:bg-white/15"
    title="Fermer"
  >
    <X size={18} />
  </button>
</div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-white p-4">
  {messages.map((msg, index) => {
    const normalizedContent = msg.content
      .replace(/\\n/g, "\n")
      .replace(
        /\*\*(Analyse[^*]+)\*\*/g,
        "\n\n**$1**\n\n"
      )
      .trim()

    return (
      <div
        key={index}
        className={` w-fit rounded-2xl px-4 py-3 text-sm ${
          msg.role === "user"
  ? "ml-auto max-w-[78%] text-white"
  : "mr-auto max-w-[88%] border border-gray-200 bg-gray-100 text-black"
        }`}
        style={
          msg.role === "user"
            ? { background: "var(--brand-gradient)" }
            : undefined
        }
      >
        {msg.role === "bot" ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="mb-3 mt-2 text-lg font-bold">
                  {children}
                </h1>
              ),

              h2: ({ children }) => (
                <h2 className="mb-3 mt-4 text-base font-bold">
                  {children}
                </h2>
              ),

              h3: ({ children }) => (
                <h3 className="mb-2 mt-4 text-sm font-bold">
                  {children}
                </h3>
              ),

              p: ({ children }) => (
                <p className="mb-3 leading-6 last:mb-0">
                  {children}
                </p>
              ),

              strong: ({ children }) => (
                <strong className="font-bold text-[var(--brand-primary)]">
                  {children}
                </strong>
              ),

              ul: ({ children }) => (
                <ul className="mb-3 ml-5 list-disc space-y-1">
                  {children}
                </ul>
              ),

              ol: ({ children }) => (
                <ol className="mb-3 ml-5 list-decimal space-y-1">
                  {children}
                </ol>
              ),

              li: ({ children }) => (
                <li className="leading-6">
                  {children}
                </li>
              ),
            }}
          >
            {normalizedContent}
          </ReactMarkdown>
        ) : (
          <p className="leading-6">{msg.content}</p>
        )}
      </div>
    )
  })}

  <div ref={messagesEndRef} />
</div>

              <div className="flex gap-2 border-t border-gray-200 bg-white p-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage()
                  }}
                  placeholder="Ecrire un message..."
                  className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-[var(--brand-primary)]"
                />

                <button
                  onClick={sendMessage}
                  className="rounded-xl p-2 text-white transition hover:opacity-90"
                  style={{ background: "var(--brand-gradient)" }}
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
