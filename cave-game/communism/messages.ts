export type ServerModelObject = {
  id: string
  /** url of .glb; also serves as ID for model */
  model: string
  /** 4x4 matrix (gl-matrix `mat4`) */
  transform: number[]
  /** 
   * defines a transition animation between previous and new transform. inspired
   * by minecraft block display interpolation: https://youtu.be/8MPDyaYBUnM?t=64
   */
  interpolate?: {
    /** delay after receiving object to begin interpolation, in milliseconds. defaults to 0, starting immediately */
    delay?: number
    /** length of transition animation in milliseconds */
    duration: number
  }
}

export type ServerMessage =
  | { type: 'chat', user: number, content: string }
  | { type: 'you are', id: number }
  | {
    type: 'entire-state'
    objects: ServerModelObject[]
  }

export type ClientMessage =
  | { type: 'chat', message: string }
