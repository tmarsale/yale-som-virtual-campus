import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { TALKERS } from './talk.js'

const NEAR = 4 // meters: close enough to see the "talk" prompt and press E
const AIM = 0.6 // meters: how far the view ray can pass from his chest and still count as clicking him

// Finds the chat-able avatar you're next to, and opens a chat when you click on it
// (crosshair over the avatar) or press E. Reports { id, name } or null via onNear.
export default function Interact({ enabled, onNear, onTalk }) {
  const { camera } = useThree()
  const near = useRef(null)
  const aimed = useRef(false)
  const dir = useMemo(() => new THREE.Vector3(), [])
  const to = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    let best = null
    let bestD = NEAR
    for (const [id, t] of TALKERS) {
      const d = Math.hypot(t.pos.x - camera.position.x, t.pos.z - camera.position.z)
      if (d < bestD) {
        best = id
        bestD = d
      }
    }
    aimed.current = false
    if (best) {
      // distance from the avatar's chest to the view ray
      camera.getWorldDirection(dir)
      to.copy(TALKERS.get(best).pos).sub(camera.position)
      const along = to.dot(dir)
      aimed.current = along > 0 && to.addScaledVector(dir, -along).length() < AIM
    }
    if (best !== near.current) {
      near.current = best
      onNear(best ? { id: best, name: TALKERS.get(best).name } : null)
    }
  })

  useEffect(() => {
    if (!enabled) return
    const click = (e) => {
      if (e.button === 0 && document.pointerLockElement && near.current && aimed.current) onTalk(near.current)
    }
    const key = (e) => {
      if (e.code === 'KeyE' && near.current && !e.target.closest?.('input, textarea')) onTalk(near.current)
    }
    window.addEventListener('mousedown', click)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('mousedown', click)
      window.removeEventListener('keydown', key)
    }
  }, [enabled, onTalk])
  return null
}
