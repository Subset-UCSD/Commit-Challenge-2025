export type User = {
  github: string
  discord: `${number}`
  playerName: string
}

export const users: User[]

export const discords: Record<string, string>
