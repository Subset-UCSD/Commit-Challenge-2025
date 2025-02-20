import { GltfParser, parseGltf } from "./parser"

/** `true` for `DataView` means little endian, which glb uses */
const LE = true

const decoder = new TextDecoder()

export function parseGlb(buffer: ArrayBuffer): Promise<GltfParser> {
  const view = new DataView(buffer)
  if (view.getUint32(0, LE) !== 0x46546C67) {
    throw new SyntaxError('glb doesnt start with ascii "glTF"')
  }
  if (view.getUint32(4, LE) !== 2) {
    throw new TypeError('i only support v2')
  }
  const jsonLength = view.getUint32(12, LE)
  if (view.getUint32(16, LE) !== 0x4E4F534A) {
    throw new SyntaxError('first chunk must be json')
  }
  const json = JSON.parse(decoder.decode(new Uint8Array(buffer, 20, jsonLength)))
  const binLength = view.getUint32(20 + jsonLength, LE)
  if (view.getUint32(24 + jsonLength, LE) !== 0x004E4942) {
    throw new SyntaxError('second chunk must be bin')
  }
  return parseGltf(json, {}, buffer.slice(28 + jsonLength, 28 + jsonLength + binLength))
}
