import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TALKERS, convo } from './talk.js'

// shortest signed angle from a to b
const dAngle = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a))

// Shared behavior for professors you can chat with. Registers the avatar in TALKERS and, each
// frame: scans the room when idle; during a chat turns to face you, looks up/down at the camera,
// tilts the head and puts a hand to the chin while thinking, gestures and moves the mouth while
// speaking. Attach the returned refs to the root group, head group, right-arm group and mouth mesh.
// onFrame(t, state) runs after, for avatar-specific extras (swinging charms, etc.).
export default function useChatAvatar({ id, name, room, position, rotation, phase = 0, headY = 1.66, onFrame }) {
  const root = useRef()
  const head = useRef()
  const armR = useRef()
  const mouth = useRef()
  const yaw = useRef(rotation)
  const chest = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    TALKERS.set(id, { name, room, pos: chest })
    return () => TALKERS.delete(id)
  }, [id, name, room, chest])

  useFrame(({ clock, camera }, dt) => {
    const t = clock.elapsedTime + phase
    const g = root.current
    g.getWorldPosition(chest)
    chest.y += headY - 0.36

    const chatting = convo.with === id
    const thinking = chatting && convo.thinking
    const speaking = chatting && performance.now() < convo.speakUntil
    const target = chatting ? Math.atan2(camera.position.x - chest.x, camera.position.z - chest.z) : rotation + Math.sin(t * 0.4) * 0.35
    yaw.current += dAngle(yaw.current, target) * Math.min(1, dt * (chatting ? 6 : 2))
    g.rotation.y = yaw.current
    g.position.y = position[1] + Math.sin(t * 2) * 0.006 // breathing

    const h = head.current
    const pitch = chatting ? -Math.atan2(camera.position.y - (chest.y + 0.36), Math.hypot(camera.position.x - chest.x, camera.position.z - chest.z)) : 0
    h.rotation.x += (THREE.MathUtils.clamp(pitch, -0.4, 0.4) - h.rotation.x) * Math.min(1, dt * 5)
    h.rotation.z += ((thinking ? 0.18 : 0) - h.rotation.z) * Math.min(1, dt * 4)

    let ax = -0.1
    let az = -0.12
    if (thinking) {
      ax = -2.15
      az = 0.55
    } else if (speaking) {
      ax = -1.2 + Math.sin(t * 7) * 0.35
      az = -0.35 + Math.sin(t * 3.5) * 0.15
    }
    const a = armR.current
    a.rotation.x += (ax - a.rotation.x) * Math.min(1, dt * 8)
    a.rotation.z += (az - a.rotation.z) * Math.min(1, dt * 8)

    mouth.current.scale.y = speaking ? 0.008 + Math.abs(Math.sin(t * 14)) * 0.02 : 0.008
    onFrame?.(t, { chatting, thinking, speaking })
  })

  return { root, head, armR, mouth }
}
