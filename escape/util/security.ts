import { Field } from "@noble/curves/abstract/modular";
import { weierstrass } from "@noble/curves/abstract/weierstrass";
import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha2";
import { concatBytes, randomBytes } from "@noble/hashes/utils";

 const base64ToBytes = (base64: string): Uint8Array =>
  Uint8Array.from(atob(base64), (char) => char.codePointAt(0) ?? 0);
 const bytesToBase64 = (bytes: Uint8Array) =>
  btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const p192Curve = weierstrass({
  Fp: Field(0xfffffffffffffffffffffffffffffffeffffffffffffffffn),
  a: 0xfffffffffffffffffffffffffffffffefffffffffffffffcn,
  b: 0x64210519e59c80e70fa7e9ab72243049feb8deecc146b9b1n,
  Gx: 0x188da80eb03090f67cbf20eb43a18800f4ff0afd82ff1012n,
  Gy: 0x07192b95ffc8da78631011ed6b24cdd573f977a11e794811n,
  n: 0xffffffffffffffffffffffff99def836146bc9b1b4d22831n,
  h: 0x1n,
  hash: sha256, // sha256 from @noble/hashes is suitable
  hmac: (key: Uint8Array, ...messages: Uint8Array[]): Uint8Array =>
    hmac(sha256, key, concatBytes(...messages)),
  randomBytes,
  nBitLength: 192,
  nByteLength: 24,
});

/** p+190RD+jVU= */
const salt = new Uint8Array([167, 237, 125, 209, 16, 254, 141, 85]);
const password = base64ToBytes('vklL/vdGUHnBlDyRSqF49lEQZS0f1aoD')

export function encryptData<T>(
  json: T
): string {
  const data = textEncoder.encode(JSON.stringify(json))

  // hash signed data per SHA256withECDSA
  const messageHash = sha256(data);
  // sign hash
  const signature = p192Curve.sign(messageHash, password);
  // serialize to DER
  const derSignature = signature.toDERRawBytes();

  const payload = new Uint8Array(data.length + derSignature.length + 4)
  const view = new DataView(payload.buffer)
  view.setInt32(0, data.length, false)
payload.set(data, 4);
payload.set(derSignature, data.length+4);

  return bytesToBase64(payload);
}

const publicKeyBytes = p192Curve.getPublicKey(password);
export function decryptData<T>(encrypted:string):T {
  const payload = base64ToBytes(encrypted)
  const view = new DataView(payload.buffer)
  const data = payload.slice(4, 4 +view.getInt32(0,false) )
  const signature = payload.slice(4 +view.getInt32(0,false) )
  const messageHashBytes = sha256(data);
  if (!p192Curve.verify(
      signature,
      messageHashBytes,
      publicKeyBytes
    )) {
      // throw JSON.parse('{')
      throw new Error('save data is corrupted D:')
    }
  try {
    return JSON.parse(textDecoder.decode(data))
  } catch(error) {
console.error(error)
throw new Error('save data is corrupted D:')
  }
}

