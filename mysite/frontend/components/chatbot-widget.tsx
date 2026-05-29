"use client"

import { useEffect, useRef, useState } from "react"
import { MessageCircle, X, Send, ArrowLeft, Minus } from "lucide-react"


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
        className="fixed bottom-6 right-6 z-50 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white shadow-lg transition hover:scale-105"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[340px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#09051f] shadow-2xl">
          {screen === "welcome" && (
            <div className="relative flex h-full flex-col items-center justify-between overflow-hidden rounded-3xl bg-[#09051f] px-6 pb-6 pt-8 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.38),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.20),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(217,70,239,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.18),transparent_28%),linear-gradient(180deg,#16063a_0%,#0b0224_55%,#050312_100%)]" />

              <div className="absolute -left-12 top-16 h-32 w-32 rounded-full bg-fuchsia-500/20 blur-3xl animate-pulse" />
              <div className="absolute right-0 top-24 h-24 w-24 rounded-full bg-cyan-400/20 blur-3xl animate-pulse" />
              <div className="absolute bottom-24 left-0 h-28 w-28 rounded-full bg-violet-400/20 blur-3xl animate-pulse" />
              <div className="absolute bottom-10 right-8 h-36 w-36 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />

              <div className="absolute left-1/2 top-[43%] h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
              <div className="absolute left-1/2 top-[43%] h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/10" />
              <div className="absolute left-1/2 top-[43%] h-[295px] w-[295px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10" />

              <div className="absolute left-8 top-24 h-4 w-4 animate-[floatUp_6s_ease-in-out_infinite] rounded-full bg-cyan-300/80 shadow-[0_0_18px_rgba(103,232,249,0.85)]" />
              <div className="absolute right-10 top-40 h-3 w-3 animate-[floatUp_7s_ease-in-out_infinite] rounded-full bg-fuchsia-300/80 shadow-[0_0_18px_rgba(244,114,182,0.8)] [animation-delay:1s]" />
              <div className="absolute left-14 bottom-44 h-5 w-5 animate-[floatUp_8s_ease-in-out_infinite] rounded-full bg-violet-300/80 shadow-[0_0_20px_rgba(196,181,253,0.85)] [animation-delay:2s]" />
              <div className="absolute right-16 bottom-36 h-4 w-4 animate-[floatUp_6.5s_ease-in-out_infinite] rounded-full bg-sky-300/80 shadow-[0_0_20px_rgba(125,211,252,0.85)] [animation-delay:1.5s]" />
              <div className="absolute left-1/2 top-20 h-2.5 w-2.5 animate-[floatUp_7.5s_ease-in-out_infinite] rounded-full bg-white/80 shadow-[0_0_14px_rgba(255,255,255,0.8)] [animation-delay:0.8s]" />

              <div className="absolute left-12 top-16 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.95)] animate-pulse" />
              <div className="absolute right-20 top-20 h-1 w-1 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(186,230,253,0.9)] animate-pulse [animation-delay:0.8s]" />
              <div className="absolute left-20 top-52 h-1 w-1 rounded-full bg-fuchsia-200 shadow-[0_0_10px_rgba(245,208,254,0.9)] animate-pulse [animation-delay:1.3s]" />
              <div className="absolute right-12 bottom-52 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.95)] animate-pulse [animation-delay:1.7s]" />
              <div className="absolute left-10 bottom-28 h-1 w-1 rounded-full bg-violet-200 shadow-[0_0_10px_rgba(221,214,254,0.95)] animate-pulse [animation-delay:0.5s]" />

              <button
                onClick={handleClose}
                className="absolute right-4 top-4 z-20 rounded-full bg-white/10 p-2 text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <X size={18} />
              </button>

              <div className="relative z-10 mt-2 rounded-full border border-white/10 bg-violet-400/20 px-4 py-1 text-xs font-medium text-violet-100 shadow-[0_0_25px_rgba(139,92,246,0.25)] backdrop-blur-md">
                Personal AI Buddy
              </div>

              <div className="relative z-10 flex flex-1 items-center justify-center">
                <div className="absolute h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
                <img
                  src="/robot.png"
                  alt="AI Robot"
                  className="relative z-10 max-h-[280px] w-auto object-contain drop-shadow-[0_0_40px_rgba(139,92,246,0.38)]"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              </div>

              <div className="relative z-10 mb-4 text-center">
                <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
                  How may I help you today!
                  <br />
                </h2>
              </div>

              <button
                onClick={() => setScreen("chat")}
                className="relative z-10 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.6)] transition hover:scale-105"
              >
                Get Started
              </button>
            </div>
          )}

          {screen === "chat" && (
            <>
              <div className="flex items-center justify-between bg-gradient-to-r from-purple-700 to-indigo-700 px-4 py-4 text-white">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setScreen("welcome")}
                    className="rounded-full bg-white/10 p-2 hover:bg-white/20"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  <div>
                    <h3 className="text-sm font-semibold">AI Assistant</h3>
                    <p className="text-xs text-white/80">Smart SEO Chatbot</p>
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
  {messages.map((msg, index) => (
    <div
      key={index}
      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
        msg.role === "user"
          ? "ml-auto bg-purple-600 text-white"
          : "bg-gray-100 text-black border border-gray-200"
      }`}
    >
      {msg.content}
    </div>
  ))}

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
                  placeholder="Écrire un message..."
                  className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-purple-500"
                />

                <button
                  onClick={sendMessage}
                  className="rounded-xl bg-purple-600 p-2 text-white transition hover:bg-purple-700"
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