import { io } from 'socket.io-client'

const socketUrl = import.meta.env.VITE_SOCKET_URL || (
  import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin
)

export const socket = io(socketUrl, { autoConnect: false })
