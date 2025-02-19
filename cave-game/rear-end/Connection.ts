import type { WebSocket } from 'ws'
import { ServerMessage } from '../communism/types'

export class Connection {
  id: number
  #ws: WebSocket

  constructor (id: number, ws: WebSocket) {
    this.id = id
    this.#ws = ws
  }

  send (message: ServerMessage) {
    this.#ws.send(JSON.stringify(message))
  }
}
