export type ServerMessage =
  | { type: 'chat', user: number, content: string }
  | { type: 'you are', id: number }

export type ClientMessage =
  | { type: 'chat', message: string }
