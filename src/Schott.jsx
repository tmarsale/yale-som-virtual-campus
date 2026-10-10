import { useRef } from 'react'
import * as THREE from 'three'
import useChatAvatar from './useChatAvatar.js'

// Prof. Peter Schott: tousled brown hair, light-blue open-collar oxford shirt, khaki chinos,
// and a Totoro plush in his left hand. Built from primitives; faces +z, right hand at -x.
// Chat behavior (facing you, thinking, talking) comes from useChatAvatar.

const ID = 'schott'
const SKIN = '#e8bf9c'
const HAIR = '#5a3a22'
const SHIRT = '#b8cdee'
const CHINOS = '#bba684'

const mats = new Map()
const m = (color, o = {}) => {
  const k = color + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o }))
  return mats.get(k)
}
const SPH = new THREE.SphereGeometry(1, 24, 16)
const CYL = new THREE.CylinderGeometry(1, 1, 1, 20)
const BOX = new THREE.BoxGeometry(1, 1, 1)
const CONE = new THREE.ConeGeometry(1, 1, 16)
const CAP = new THREE.CapsuleGeometry(1, 1, 6, 12)
const B = ({ g = SPH, c, p, s, r = [0, 0, 0], o, mat }) => <mesh geometry={g} material={mat || m(c, o)} position={p} scale={s} rotation={r} />

// a ~0.3 m Totoro plush: gray egg body, cream belly with chevrons, pointy ears, big eyes, a leaf on top
function Totoro(props) {
  const gray = '#868a92'
  const cream = '#efe6d2'
  return (
    <group {...props}>
      <B c={gray} p={[0, 0.14, 0]} s={[0.12, 0.15, 0.11]} />
      <B c={cream} p={[0, 0.11, 0.05]} s={[0.085, 0.1, 0.07]} />
      {[0.15, 0.12, 0.09].map((y, i) => (
        <B key={i} g={CONE} c="#5d6068" p={[0, y, 0.118]} r={[Math.PI / 2, 0, 0]} s={[0.012, 0.01, 0.006]} />
      ))}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B g={CONE} c={gray} p={[0.05 * sx, 0.31, -0.01]} r={[0, 0, -0.12 * sx]} s={[0.025, 0.08, 0.02]} />
          <B c="#ffffff" p={[0.042 * sx, 0.235, 0.095]} s={[0.022, 0.022, 0.012]} />
          <B c="#111111" p={[0.042 * sx, 0.235, 0.105]} s={[0.01, 0.01, 0.006]} />
          {[0, 1].map((k) => (
            <B key={k} g={BOX} c="#2b2b2b" p={[0.085 * sx, 0.205 - k * 0.012, 0.085]} r={[0, 0, 0.15 * sx * (k ? -1 : 1)]} s={[0.05, 0.003, 0.003]} />
          ))}
          <B c={gray} p={[0.1 * sx, 0.12, 0.02]} s={[0.035, 0.07, 0.035]} />
          <B c={gray} p={[0.05 * sx, 0.005, 0.03]} s={[0.04, 0.025, 0.045]} />
        </group>
      ))}
      <B c="#111111" p={[0, 0.218, 0.108]} s={[0.012, 0.007, 0.006]} />
      <B c="#4c9a3c" p={[0, 0.3, 0]} r={[0, 0, 0.3]} s={[0.06, 0.008, 0.045]} />
    </group>
  )
}

export default function Schott({ position = [0, 0, 0], rotation = 0, phase = 0 }) {
  const plush = useRef()
  const { root, head, armR, mouth } = useChatAvatar({
    id: ID,
    name: 'Prof. Peter Schott',
    room: 'EVANS 2210',
    position,
    rotation,
    phase,
    headY: 1.72,
    onFrame: (t, { speaking }) => {
      // Totoro gets a little bounce, more when he's excited about a problem
      plush.current.rotation.z = Math.sin(t * (speaking ? 6 : 1.6)) * (speaking ? 0.2 : 0.06)
    },
  })
  const shirt = m(SHIRT, { roughness: 0.9 })
  const skin = m(SKIN)
  return (
    <group ref={root} position={position} rotation={[0, rotation, 0]}>
      {/* brown leather shoes */}
      {[-1, 1].map((sx) => (
        <B key={sx} g={BOX} c="#5b3a24" o={{ roughness: 0.5 }} p={[0.1 * sx, 0.04, 0.03]} s={[0.1, 0.08, 0.27]} />
      ))}
      {/* khaki chinos + belt */}
      {[-1, 1].map((sx) => (
        <B key={sx} g={CYL} c={CHINOS} p={[0.1 * sx, 0.5, 0]} s={[0.078, 0.86, 0.078]} />
      ))}
      <B g={CYL} c={CHINOS} p={[0, 0.92, 0]} s={[0.19, 0.14, 0.14]} />
      <B g={CYL} c="#4a2f1e" p={[0, 0.99, 0]} s={[0.195, 0.035, 0.145]} />
      <B g={BOX} c="#c9b27a" o={{ metalness: 0.7, roughness: 0.3 }} p={[0, 0.99, 0.146]} s={[0.035, 0.025, 0.01]} />

      {/* light-blue oxford shirt, tucked in */}
      <mesh geometry={CYL} material={shirt} position={[0, 1.25, 0]} scale={[0.215, 0.52, 0.155]} />
      <B mat={shirt} p={[0, 1.5, 0]} s={[0.27, 0.09, 0.16]} />
      {/* button placket + buttons, chest pocket on his left */}
      <B g={BOX} c="#a9bfe3" p={[0, 1.2, 0.153]} s={[0.022, 0.4, 0.006]} />
      {[1.06, 1.16, 1.26, 1.36].map((y) => (
        <B key={y} c="#f2f2f2" p={[0, y, 0.158]} s={[0.007, 0.007, 0.004]} />
      ))}
      <B g={BOX} c="#a9bfe3" p={[0.1, 1.33, 0.148]} s={[0.075, 0.08, 0.006]} />
      {/* open collar: skin V at the neck, collar points spread over it */}
      <B mat={skin} p={[0, 1.5, 0.11]} r={[0.25, 0, Math.PI / 4]} s={[0.05, 0.05, 0.02]} />
      {[-1, 1].map((sx) => (
        <B key={sx} g={BOX} c="#c4d6f2" p={[0.055 * sx, 1.52, 0.125]} r={[0.35, 0.25 * sx, 0.55 * sx]} s={[0.075, 0.035, 0.012]} />
      ))}
      <B g={CYL} c="#c4d6f2" p={[0, 1.56, -0.01]} s={[0.065, 0.04, 0.06]} />
      <B mat={skin} p={[0, 1.6, 0]} s={[0.05, 0.06, 0.05]} />

      {/* left arm hangs, holding Totoro */}
      <group position={[0.27, 1.49, 0]} rotation={[0.12, 0, 0.14]}>
        <mesh geometry={CAP} material={shirt} position={[0, -0.26, 0]} scale={[0.066, 0.22, 0.066]} />
        <B mat={skin} p={[0, -0.54, 0.02]} s={[0.045, 0.055, 0.042]} />
        <group ref={plush} position={[0, -0.56, 0.08]}>
          <Totoro position={[0, -0.24, 0]} rotation={[0, -0.3, 0]} />
        </group>
      </group>
      {/* right arm: animated */}
      <group ref={armR} position={[-0.27, 1.49, 0]}>
        <mesh geometry={CAP} material={shirt} position={[0, -0.26, 0]} scale={[0.066, 0.22, 0.066]} />
        <B mat={skin} p={[0, -0.54, 0.02]} s={[0.045, 0.055, 0.042]} />
      </group>

      {/* head */}
      <group ref={head} position={[0, 1.72, 0]}>
        <B mat={skin} s={[0.112, 0.138, 0.122]} />
        <B mat={skin} p={[0, -0.075, 0.035]} s={[0.085, 0.06, 0.08]} />
        {[-1, 1].map((sx) => (
          <B key={sx} mat={skin} p={[0.114 * sx, 0, 0]} s={[0.02, 0.034, 0.02]} />
        ))}
        {/* tousled, wavy brown hair: fuller on top, short on the sides */}
        <B c={HAIR} p={[0, 0.065, -0.02]} s={[0.12, 0.085, 0.128]} />
        {[
          [-0.06, 0.12, 0.05, 0.4],
          [0.0, 0.135, 0.06, 0.1],
          [0.06, 0.12, 0.045, -0.3],
          [-0.03, 0.14, -0.02, 0.2],
          [0.04, 0.14, -0.03, -0.2],
          [0.08, 0.09, 0.07, -0.6],
        ].map(([x, y, z, rz], i) => (
          <B key={i} c={HAIR} p={[x, y, z]} r={[0.3, 0, rz]} s={[0.055, 0.035, 0.05]} />
        ))}
        {[-1, 1].map((sx) => (
          <B key={sx} c={HAIR} p={[0.1 * sx, 0.03, -0.02]} s={[0.028, 0.06, 0.09]} />
        ))}
        {/* blue-gray eyes, brows, a friendly half smile */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <B c="#ffffff" p={[0.043 * sx, 0.022, 0.106]} s={[0.021, 0.015, 0.012]} />
            <B c="#5f7690" p={[0.043 * sx, 0.022, 0.116]} s={[0.01, 0.011, 0.008]} />
            <B g={BOX} c="#4a3020" p={[0.045 * sx, 0.055, 0.11]} r={[0, 0, -0.06 * sx]} s={[0.045, 0.01, 0.01]} />
          </group>
        ))}
        <B mat={skin} p={[0, -0.012, 0.124]} s={[0.022, 0.034, 0.026]} />
        <mesh ref={mouth} geometry={BOX} material={m('#8a4a40')} position={[0.005, -0.06, 0.113]} rotation={[0, 0, -0.06]} scale={[0.055, 0.008, 0.01]} />
      </group>
    </group>
  )
}
