// Shared state between the 3D scene (avatars, Interact) and the DOM chat window.
// Plain mutable objects so useFrame loops can read them without React re-renders.

// avatars you can chat with register here: id -> { name, room, pos: THREE.Vector3 (chest, world) }
export const TALKERS = new Map()

// the current conversation; avatars read this to turn toward you and animate
export const convo = {
  with: null, // professor id or null
  thinking: false, // waiting for the backend
  speakUntil: 0, // performance.now() until which the avatar "talks"
}
