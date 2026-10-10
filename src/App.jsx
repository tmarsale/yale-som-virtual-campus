import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import World from './World.jsx'
import Player from './Player.jsx'
import Minimap from './Minimap.jsx'
import TouchControls from './TouchControls.jsx'
import Interact from './Interact.jsx'
import ChatPanel from './ChatPanel.jsx'
import { TALKERS, convo } from './talk.js'
import { EYE, SPAWN } from './layout.js'

const GREETING = {
  zaman: "Yo! Welcome to 2200. I'm the AI version of Prof. Zaman. Ask me about stats, regression, the central limit theorem, AI agents, or any class at SOM. I can look 'em all up.",
  schott: "Hey, welcome to 2210! I'm the AI version of Peter Schott. Stats, regression, trade, China and the manufacturing jobs puzzle: bring it on. Fair warning, I love a good long problem. And hey, how's the class going for you?",
}

export default function App() {
  const [locked, setLocked] = useState(false)
  const [where, setWhere] = useState('')
  const [showMap, setShowMap] = useState(true)
  const lockRef = useRef()
  const mapRef = useRef()
  const onLock = useCallback((v) => setLocked(v), [])
  const onWhere = useCallback((w) => setWhere(w), [])
  // phones have no pointer lock, so they get a joystick + drag-to-look instead
  const [isTouch] = useState(() => matchMedia('(pointer: coarse)').matches) // phones + tablets; touchscreen laptops still get mouse mode
  const [touchOn, setTouchOn] = useState(false)
  const touchRef = useRef({ active: false, move: [0, 0], look: [0, 0], jump: false })
  const setTouch = (on) => {
    touchRef.current.active = on
    touchRef.current.move = [0, 0]
    setTouchOn(on)
  }
  const playing = locked || touchOn

  // chatting with AI professors: walk up, click them (or press E / tap the hint)
  const [near, setNear] = useState(null)
  const [chatWith, setChatWith] = useState(null)
  const [chats, setChats] = useState({}) // prof id -> messages, kept while you walk around
  const onNear = useCallback((n) => setNear(n), [])
  const openChat = useCallback((id) => {
    convo.with = id
    setChatWith(id)
    setChats((c) => (c[id] ? c : { ...c, [id]: [{ role: 'prof', text: GREETING[id] ?? 'Yo! What can I help with?' }] }))
    document.exitPointerLock?.()
  }, [])
  const closeChat = useCallback(() => {
    convo.with = null
    setChatWith(null)
    if (!touchRef.current.active) lockRef.current?.() // straight back to walking
  }, [])
  const setMessages = useCallback((fn) => setChats((c) => ({ ...c, [chatWith]: fn(c[chatWith] ?? []) })), [chatWith])

  useEffect(() => {
    const k = (e) => e.code === 'KeyM' && !e.target.closest?.('input, textarea') && setShowMap((v) => !v)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  return (
    <>
      <Canvas
        camera={{ fov: 72, near: 0.05, far: 800, position: [SPAWN.x, EYE, SPAWN.z] }}
        dpr={[1, 1.75]}
      >
        <World />
        <Player lockRef={lockRef} mapRef={mapRef} touchRef={touchRef} onLock={onLock} onWhere={onWhere} />
        <Interact enabled={!chatWith} onNear={onNear} onTalk={openChat} />
      </Canvas>

      <div className="where">
        <span className="dot" />
        {where}
      </div>
      <div className={showMap ? 'mapwrap' : 'mapwrap hidden'}>
        <Minimap drawRef={mapRef} />
      </div>
      <button className="maptoggle" onClick={() => setShowMap((s) => !s)}>
        {showMap ? 'hide map' : 'map'}
      </button>
      {playing && <div className="crosshair" />}
      {touchOn && !chatWith && <TouchControls touchRef={touchRef} onPause={() => setTouch(false)} />}

      {near && !chatWith && playing && (
        <div className="talkhint" onClick={() => openChat(near.id)}>
          {isTouch || touchOn ? 'Tap here' : <>Click <b>{near.name}</b> or press <b>E</b></>} to chat
        </div>
      )}
      {chatWith && (
        <ChatPanel
          prof={{ id: chatWith, name: TALKERS.get(chatWith)?.name ?? chatWith, room: TALKERS.get(chatWith)?.room ?? '' }}
          messages={chats[chatWith] ?? []}
          setMessages={setMessages}
          onClose={closeChat}
        />
      )}

      {!playing && !chatWith && (
        <div className="overlay" onClick={() => (isTouch ? setTouch(true) : lockRef.current?.())}>
          <div className="card">
            <div className="kicker">Yale SOM · Evans Hall</div>
            <h1>Floor 2</h1>
            <p className="sub">Classroom drums, the cloister, Ross Library, the Beinecke Terrace Room, and the courtyard.</p>
            <button className="go">{isTouch ? 'Tap to walk in' : 'Click to walk in'}</button>
            {!isTouch && (
              <button
                className="go alt"
                onClick={(e) => {
                  e.stopPropagation()
                  setTouch(true)
                }}
              >
                Use on-screen joystick
              </button>
            )}
            {isTouch ? (
              <div className="keys">
                <span><b>Left thumb</b> joystick to walk (push all the way to hurry)</span>
                <span><b>Right thumb</b> drag to look</span>
              </div>
            ) : (
              <div className="keys">
                <span><b>W A S D</b> walk</span>
                <span><b>Mouse</b> look</span>
                <span><b>Shift</b> sprint</span>
                <span><b>Space</b> jump</span>
                <span><b>C</b> crouch</span>
                <span><b>M</b> map</span>
                <span><b>Esc</b> pause</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
