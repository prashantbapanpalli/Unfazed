import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { API_ORIGIN } from '../../api/axiosInstance'
import MessageBubble from './MessageBubble'

// Used by both sides. role = 'therapist' | 'client'. http = axios instance for history/upload.
export default function ChatWindow({ role, token, clientId, http, historyUrl }) {
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [error, setError] = useState('')
  const sock = useRef(null)
  const bottom = useRef(null)
  const typingTimer = useRef(null)

  useEffect(() => {
    setMsgs([]); setError('')
    http.get(historyUrl).then((r) => setMsgs(r.data))
    const s = io(API_ORIGIN, { auth: { token } })
    sock.current = s
    const markRead = () => s.emit('chat:read', { clientId })
    s.on('connect', () => { if (role === 'therapist') s.emit('chat:join', { clientId }, markRead); else markRead() })
    s.on('chat:message', (m) => { setMsgs((p) => (p.some((x) => x._id === m._id) ? p : [...p, m])); if (m.sender !== role) markRead() })
    s.on('chat:typing', (e) => { if (e.from !== role) setTyping(e.typing) })
    s.on('chat:read', () => setMsgs((p) => p.map((m) => (m.sender === role && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m))))
    return () => s.disconnect()
  }, [clientId, token, role, historyUrl]) // eslint-disable-line

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, typing])

  const send = (payload) => sock.current.emit('chat:send', { clientId, ...payload }, (ack) => {
    if (ack?.error === 'upgrade_required') setError('Chat is not part of this plan.')
    else if (ack?.error) setError('Message failed to send')
  })
  const submit = (e) => { e.preventDefault(); if (!text.trim()) return; send({ text: text.trim() }); setText(''); sock.current.emit('chat:typing', { clientId, typing: false }) }
  const onType = (v) => {
    setText(v)
    sock.current?.emit('chat:typing', { clientId, typing: true })
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => sock.current?.emit('chat:typing', { clientId, typing: false }), 1200)
  }
  const upload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData(); fd.append('file', file)
    try { const { data } = await http.post('/chat/upload', fd); send({ attachment: data }) } catch (er) { setError(er.userMessage) }
    e.target.value = ''
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border border-slate-200 bg-slate-100">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {msgs.map((m) => <MessageBubble key={m._id} m={m} me={role} />)}
        {typing && <p className="text-xs italic text-slate-500">typing...</p>}
        <div ref={bottom} />
      </div>
      {error && <p className="px-4 text-xs text-rose-600">{error}</p>}
      <form onSubmit={submit} className="flex items-center gap-2 border-t bg-white p-3">
        <label className="btn-ghost cursor-pointer !px-3">+<input type="file" className="hidden" onChange={upload} /></label>
        <input className="input" placeholder="Type a message" value={text} onChange={(e) => onType(e.target.value)} />
        <button className="btn">Send</button>
      </form>
    </div>
  )
}
