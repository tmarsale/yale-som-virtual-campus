import { useEffect, useRef, useState } from 'react'
import { convo } from './talk.js'

// Chat window for talking to an AI professor (backend/main.py).
// In dev, Vite proxies /api to the FastAPI server; set VITE_API_URL to point elsewhere.
const API = import.meta.env.VITE_API_URL ?? ''

const sessionId = (() => {
  let id = sessionStorage.getItem('chat-session')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('chat-session', id)
  }
  return id
})()

// **bold**, *italic* and `code` are all the markdown the professors really use
function Rich({ text }) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <b key={i}>{part.slice(2, -2)}</b>
    ) : part.length > 2 && part.startsWith('*') && part.endsWith('*') ? (
      <i key={i}>{part.slice(1, -1)}</i>
    ) : part.startsWith('`') && part.endsWith('`') ? (
      <code key={i}>{part.slice(1, -1)}</code>
    ) : (
      part
    ),
  )
}

export default function ChatPanel({ prof, messages, setMessages, onClose }) {
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const input = useRef()
  const log = useRef()

  useEffect(() => {
    input.current?.focus()
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  async function send(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || busy) return
    setDraft('')
    setMessages((m) => [...m, { role: 'user', text }])
    setBusy(true)
    convo.thinking = true
    try {
      const res = await fetch(`${API}/api/professors/${prof.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || `Server error ${res.status}`)
      setMessages((m) => [...m, { role: 'prof', text: data.reply }])
      convo.speakUntil = performance.now() + Math.min(7000, 1200 + data.reply.length * 35)
    } catch (err) {
      const msg = err instanceof TypeError ? "Can't reach the backend. Is it running on port 8000?" : err.message
      setMessages((m) => [...m, { role: 'error', text: msg }])
    } finally {
      convo.thinking = false
      setBusy(false)
      input.current?.focus()
    }
  }

  return (
    <div className="chat" onMouseDown={(e) => e.stopPropagation()}>
      <div className="chat-head">
        <div>
          <div className="chat-name">{prof.name}</div>
          <div className="chat-sub">{prof.room} · AI professor</div>
        </div>
        <button className="chat-x" onClick={onClose} title="Close (Esc)">
          ×
        </button>
      </div>
      <div className="chat-log" ref={log}>
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <Rich text={m.text} />
          </div>
        ))}
        {busy && <div className="msg prof typing">thinking…</div>}
      </div>
      <form className="chat-in" onSubmit={send}>
        <input ref={input} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about stats, AI, or any SOM class…" maxLength={4000} />
        <button disabled={busy || !draft.trim()}>Send</button>
      </form>
    </div>
  )
}
