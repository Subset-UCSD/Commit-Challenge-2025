import { ServerMessage } from "../communism/types";
import { send } from "./net";
import './index.css'
import { expect } from "../communism/utils";
import { Gl } from "./render/Gl";
import { GltfModel } from "./render/Glthefuck";
import { parseGltf } from "../communism/gltf/parser";

console.log('frontend!')

const ul = document.createElement('ul')
document.body.append(ul)

let myId = -1
export function handleMessage (message: ServerMessage) {
  switch (message.type) {
    case 'chat': {
      const li = document.createElement('li')
      li.style.whiteSpace = 'pre-wrap'
      if (myId === message.user) {
        li.append(`<我> ${message.content}`)
      } else {
        li.append(`<user${message.user.toString().padStart(3, '0')}> ${message.content}`)
      }
      ul.prepend(li)
      break
    }
    case 'you are': {
      myId = message.id
      break
    }
    default: {
      console.error('fdsluihdif', message)
    }
  }
}

const f = document.getElementById('f')
if (f instanceof HTMLFormElement) {
  f.addEventListener('submit', e => {
    e.preventDefault()

    const thing = new FormData(f).get('message')
    if (typeof thing === 'string') {
      send({ type: 'chat', message: thing })
      f.reset()
    }
  })
}

const canvas = document.getElementById('canvas')
export const gl = new Gl(
  (canvas instanceof HTMLCanvasElement ? canvas : expect('#canvas'))
    .getContext('webgl2') ?? expect('webgl context')
)
gl.gl.enable(gl.gl.CULL_FACE)
gl.gl.enable(gl.gl.DEPTH_TEST)

const cam = new Camera()

import modelRoot from '../marcelos/notacube/notacube.gltf'
import modelBinPath from '../marcelos/notacube/notacube.bin'
import { mat4, vec3 } from "gl-matrix";
import { Camera } from "./render/cam";
const model = new GltfModel(gl, await parseGltf(modelRoot, {
  'notacube.bin': modelBinPath
}))

gl.checkError()

// main game loop
while (true) {
  cam.position[2] = Math.sin(Date.now() / 848) * 5 + 10

  const view = cam.pv(window.innerWidth / window.innerHeight)

  gl.clear([0.01,0.02,0.1])
  gl.beginRender()

  gl.gltfShader.use()
  gl.gl.uniformMatrix4fv(gl.gltfShader.uniform('u_view'), false, view)
  gl.gl.uniform3f(gl.gltfShader.uniform('u_ambient_light'), 0.5, 0.5, 0.5)
  gl.gl.uniform3f(gl.gltfShader.uniform('u_dir_light_color'), 2, 2, 2)
  gl.gl.uniform3fv(gl.gltfShader.uniform('u_dir_light_dir'), vec3.normalize(vec3.create(), vec3.fromValues(1, -3, 2)))
  model.draw([{ transform: mat4.rotateX(mat4.create(), mat4.rotateY(mat4.create(), mat4.create(), Date.now() / 1000), Date.now() / 83466) }])
  
  gl.applyFilters()

  await Promise.all([new Promise(window.requestAnimationFrame), new Promise(resolve => {
    // die early if there's an error
    gl.checkError()
    resolve(0)
  })])
}
