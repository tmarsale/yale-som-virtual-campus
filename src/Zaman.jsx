import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import Labubu from './Labubu.jsx'
import useChatAvatar from './useChatAvatar.js'

// Prof. Tauhid Zaman: hoodie, glasses, a Labubu charm on his jeans and a BLACKPINK lightstick.
// Built from primitives like the wizard professors. Figure faces +z; his right hand is at -x.
// Chat behavior (facing you, thinking, talking) comes from useChatAvatar.

const ID = 'zaman'
const SKIN = '#c68e63'
const HAIR = '#16110e'
const HOODIE = '#151518'
const PINK = '#ff4fa3'
const JEANS = '#2c3d5c'

const mats = new Map()
const m = (color, o = {}) => {
  const k = color + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o }))
  return mats.get(k)
}
const SPH = new THREE.SphereGeometry(1, 24, 16)
const CYL = new THREE.CylinderGeometry(1, 1, 1, 20)
const BOX = new THREE.BoxGeometry(1, 1, 1)
const TORUS = new THREE.TorusGeometry(1, 0.14, 8, 24)
const CAP = new THREE.CapsuleGeometry(1, 1, 6, 12)
const B = ({ g = SPH, c, p, s, r = [0, 0, 0], o, mat }) => <mesh geometry={g} material={mat || m(c, o)} position={p} scale={s} rotation={r} />

function printTex() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 160
  const g = c.getContext('2d')
  g.fillStyle = HOODIE
  g.fillRect(0, 0, 512, 160)
  g.fillStyle = PINK
  g.font = '900 66px "Arial Black", Impact, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('BLACKPINK', 256, 70, 490)
  g.font = 'bold 30px system-ui, sans-serif'
  g.fillText('♥ IN YOUR AREA ♥', 256, 135)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export default function Zaman({ position = [0, 0, 0], rotation = 0, phase = 0 }) {
  const charm = useRef()
  const { root, head, armR, mouth } = useChatAvatar({
    id: ID,
    name: 'Prof. Tauhid Zaman',
    room: 'EVANS 2200',
    position,
    rotation,
    phase,
    onFrame: (t) => {
      // the Labubu charm swings on its clip
      charm.current.rotation.z = Math.sin(t * 2.3) * 0.18
      charm.current.rotation.x = Math.sin(t * 1.7) * 0.1
    },
  })
  const print = useMemo(() => new THREE.MeshStandardMaterial({ map: printTex(), roughness: 0.85 }), [])
  const stickGlow = useMemo(() => m('#ffc2e0', { emissive: PINK, emissiveIntensity: 1.6 }), [])

  const hoodie = m(HOODIE, { roughness: 0.95 })
  const skin = m(SKIN)
  return (
    <group ref={root} position={position} rotation={[0, rotation, 0]}>
      {/* sneakers */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B g={BOX} c="#f4f4f4" p={[0.1 * sx, 0.045, 0.03]} s={[0.11, 0.09, 0.26]} />
          <B g={BOX} c={PINK} p={[0.1 * sx, 0.012, 0.03]} s={[0.115, 0.025, 0.265]} />
        </group>
      ))}
      {/* jeans */}
      {[-1, 1].map((sx) => (
        <B key={sx} g={CYL} c={JEANS} p={[0.1 * sx, 0.5, 0]} s={[0.08, 0.84, 0.08]} />
      ))}
      <B g={CYL} c={JEANS} p={[0, 0.9, 0]} s={[0.19, 0.14, 0.14]} />
      {/* Labubu charm clipped to his left belt loop */}
      <group ref={charm} position={[0.19, 0.9, 0.06]}>
        <B g={TORUS} c="#c9a44a" o={{ metalness: 0.8, roughness: 0.3 }} p={[0, -0.01, 0]} r={[0, Math.PI / 2, 0]} s={[0.018, 0.018, 0.018]} />
        <B g={CYL} c="#c9a44a" o={{ metalness: 0.8, roughness: 0.3 }} p={[0, -0.05, 0]} s={[0.004, 0.07, 0.004]} />
        <Labubu height={0.22} fur="#ff8fc7" expression="mischief" position={[0, -0.31, 0]} rotation={0.3} />
      </group>

      {/* hoodie body */}
      <mesh geometry={CYL} material={hoodie} position={[0, 1.2, 0]} scale={[0.215, 0.6, 0.155]} />
      <B mat={hoodie} p={[0, 1.47, 0]} s={[0.27, 0.09, 0.16]} />
      <B g={CYL} c="#1d1d21" p={[0, 0.92, 0]} s={[0.22, 0.06, 0.16]} />
      {/* BLACKPINK print + kangaroo pocket + pink drawstrings */}
      <mesh material={print} position={[0, 1.27, 0.162]}>
        <planeGeometry args={[0.26, 0.081]} />
      </mesh>
      <B g={BOX} c="#1d1d21" p={[0, 1.04, 0.15]} s={[0.24, 0.12, 0.012]} />
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B g={CYL} c={PINK} p={[0.045 * sx, 1.4, 0.15]} s={[0.006, 0.14, 0.006]} />
          <B g={CYL} c="#f4f4f4" p={[0.045 * sx, 1.325, 0.15]} s={[0.009, 0.02, 0.009]} />
        </group>
      ))}
      {/* hood bunched behind the neck */}
      <B mat={hoodie} p={[0, 1.52, -0.1]} s={[0.17, 0.11, 0.1]} />
      <B g={TORUS} mat={hoodie} p={[0, 1.52, 0]} r={[Math.PI / 2, 0, 0]} s={[0.1, 0.1, 0.25]} />
      <B mat={skin} p={[0, 1.55, 0]} s={[0.05, 0.06, 0.05]} />

      {/* left arm hangs, holding the pink lightstick */}
      <group position={[0.27, 1.45, 0]} rotation={[0.15, 0, 0.14]}>
        <mesh geometry={CAP} material={hoodie} position={[0, -0.25, 0]} scale={[0.068, 0.21, 0.068]} />
        <B mat={skin} p={[0, -0.52, 0.02]} s={[0.045, 0.055, 0.042]} />
        <B g={CYL} c="#111" p={[0, -0.52, 0.09]} r={[Math.PI / 2, 0, 0]} s={[0.012, 0.16, 0.012]} />
        <B mat={stickGlow} p={[-0.025, -0.52, 0.2]} s={[0.04, 0.04, 0.035]} />
        <B mat={stickGlow} p={[0.025, -0.52, 0.2]} s={[0.04, 0.04, 0.035]} />
      </group>
      {/* right arm: animated */}
      <group ref={armR} position={[-0.27, 1.45, 0]}>
        <mesh geometry={CAP} material={hoodie} position={[0, -0.25, 0]} scale={[0.068, 0.21, 0.068]} />
        <B mat={skin} p={[0, -0.52, 0.02]} s={[0.045, 0.055, 0.042]} />
      </group>

      {/* head */}
      <group ref={head} position={[0, 1.66, 0]}>
        <B mat={skin} s={[0.115, 0.135, 0.125]} />
        {[-1, 1].map((sx) => (
          <B key={sx} mat={skin} p={[0.117 * sx, 0, 0]} s={[0.02, 0.034, 0.02]} />
        ))}
        {/* short black hair with a bit of volume up front */}
        <B c={HAIR} p={[0, 0.06, -0.015]} s={[0.123, 0.09, 0.13]} />
        <B c={HAIR} p={[0.02, 0.1, 0.06]} r={[0.5, 0, 0.2]} s={[0.09, 0.04, 0.06]} />
        {[-1, 1].map((sx) => (
          <B key={sx} c={HAIR} p={[0.105 * sx, 0.03, -0.01]} s={[0.025, 0.06, 0.09]} />
        ))}
        {/* eyes + brows */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <B c="#ffffff" p={[0.044 * sx, 0.025, 0.11]} s={[0.021, 0.017, 0.012]} />
            <B c="#1d1410" p={[0.044 * sx, 0.025, 0.12]} s={[0.011, 0.012, 0.008]} />
            <B g={BOX} c={HAIR} p={[0.046 * sx, 0.062, 0.112]} r={[0, 0, -0.08 * sx]} s={[0.045, 0.011, 0.01]} />
            {/* glasses */}
            <B g={TORUS} c="#0d0d0d" p={[0.046 * sx, 0.025, 0.126]} s={[0.036, 0.03, 0.03]} />
            <B g={BOX} c="#0d0d0d" p={[0.1 * sx, 0.03, 0.07]} s={[0.006, 0.008, 0.1]} />
          </group>
        ))}
        <B g={BOX} c="#0d0d0d" p={[0, 0.03, 0.13]} s={[0.022, 0.006, 0.006]} />
        <B mat={skin} p={[0, -0.01, 0.127]} s={[0.022, 0.03, 0.025]} />
        {/* easy grin; opens while talking */}
        <mesh ref={mouth} geometry={BOX} material={m('#5a2420')} position={[0, -0.055, 0.115]} scale={[0.06, 0.008, 0.01]} />
      </group>
    </group>
  )
}
