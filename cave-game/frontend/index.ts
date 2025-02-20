import { ServerMessage } from "../communism/messages";
import { send } from "./net";
import './index.css'
import { expect } from "../communism/utils";
import { Gl } from "./render/Gl";
import { GltfModel } from "./render/Glthefuck";
import interpolate from 'mat4-interpolate'

console.log('frontend!')

const ul = document.createElement('ul')
document.body.append(ul)

type ClientModelInstance = {
  id: string
  oldTransform: mat4
  transform: mat4
  animationStart: number
  animationDuration: number
}
const modelLoaded: Record<string, GltfModel | 'loading'> = {}
let modelState: Record<string, { instances: ClientModelInstance[] }> = {}

function computeTransform (instance: ClientModelInstance, now = Date.now()): mat4 {
  if (instance.animationDuration === 0) return instance.transform
  const progress = (now - instance.animationStart) / instance.animationDuration
  if (progress >= 1) return instance.transform
  if (progress <= 0) return instance.oldTransform
  const out = mat4.create()
  interpolate(out, instance.oldTransform, instance.transform, progress)
  return out
}

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
    case 'entire-state': {
      const oldState: Record<string, ClientModelInstance> = {}
      for (const { instances } of Object.values(modelState)) {
        for (const instance of instances) {
          oldState[instance.id] = instance
        }
      }
      modelState = {}
      const now = Date.now()
      for (const { id, model, transform, interpolate: { duration = 0,delay = 0 } = {  } } of message.objects) {
        if (!modelLoaded[model]) {
          modelLoaded[model] = 'loading'
          fetch(model).then(r => r.arrayBuffer()).then(parseGlb).then(parsed => {
            modelLoaded[model] = new GltfModel(gl, parsed)
          })
        }
        modelState[model] ??= {
          instances: []
        }
        modelState[model].instances.push({
          id,
          oldTransform: oldState[id] ? computeTransform(oldState[id], now) : new Float32Array(transform),
          transform: new Float32Array(transform),
          animationStart: now + delay,
          animationDuration: duration,
        })
      }
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

function resize () {
  gl.gl.canvas.width = window.innerWidth
  gl.gl.canvas.height = window.innerHeight
}
resize()
window.addEventListener('resize', resize)

const cam = new Camera()

import modelGlb from '../public/marcelos/notacube.glb'
import modelGlb2 from '../public/marcelos/notacube_smooth.glb'
import { mat4, vec3 } from "gl-matrix";
import { Camera } from "./render/cam";
import { parseGlb } from "../communism/gltf/bingltfparser";
const model = new GltfModel(gl, await fetch(modelGlb).then(r => r.arrayBuffer()).then(parseGlb))
const model2 = new GltfModel(gl, await fetch(modelGlb2).then(r => r.arrayBuffer()).then(parseGlb))

gl.checkError()

// main game loop
while (true) {
  const now = Date.now()
  cam.position[2] = (Math.sin(now / 1248) + 1) * (25-3)/2 + 3

  const view = cam.pv(window.innerWidth / window.innerHeight)

  gl.clear([0.01,0.02,0.1])
  gl.beginRender()

  gl.gltfShader.use()
  gl.gl.uniformMatrix4fv(gl.gltfShader.uniform('u_view'), false, view)
  gl.gl.uniform3f(gl.gltfShader.uniform('u_ambient_light'), 0.5, 0.5, 0.5)
  gl.gl.uniform3f(gl.gltfShader.uniform('u_dir_light_color'), 2, 2, 2)
  gl.gl.uniform3fv(gl.gltfShader.uniform('u_dir_light_dir'), vec3.normalize(vec3.create(), vec3.fromValues(Math.cos(now / 362), Math.sin(now / 362), 0.3)))
  const instances = Array.from({length: 10}, (_, i) => ({ 
    transform:
    mat4.rotateY(mat4.create(),
    mat4.rotateX(mat4.create(),
    mat4.translate(mat4.create(),
    mat4.create(),
    [Math.cos(i / 10 * 2 * Math.PI + now / 2877)*5,2*Math.sin(now / 432 + i / 10 * 4 * Math.PI),Math.sin(i / 10 * 2 * Math.PI + now / 2877)*5]),
    now / (83466 + i * 36636)),
    now / (1000 + i * 283)),
   }))
  model.draw([...instances.filter((_, i) => i % 2 === 0), ...Array.from({length: 100}, (_, i) => ({ 
    transform:
    mat4.rotateX(mat4.create(),
    mat4.translate(mat4.create(),
    mat4.create(),
    [Math.cos(i / 100 * 2 * Math.PI + now / -1987)*25,Math.sin(i / 100 * 2 * Math.PI + now / -1987)*25,10*Math.sin(now / 432 + i / 100 * 60 * Math.PI)-70]),
    now / -787 + i/100*2*Math.PI),
   }))])
  model2.draw([...instances.filter((_, i) => i % 2 !== 0), ...Array.from({length: 100}, (_, i) => ({ 
    transform:
    mat4.rotateX(mat4.create(),
    mat4.translate(mat4.create(),
    mat4.create(),
    [Math.cos(i / 100 * 2 * Math.PI + now / 1987)*25,Math.sin(i / 100 * 2 * Math.PI + now / 1987)*25,10*Math.sin(now / 432 + i / 100 * 60 * Math.PI)-40,]),
    now / 787 + i/100*2*Math.PI),
   }))])

   for (const [modelId, { instances }] of Object.entries(modelState)) {
    const model = modelLoaded[modelId]
    if (!model || model === 'loading') {
      continue
    }
    model.draw(instances.map(inst => ({ transform: computeTransform(inst, now) })))
   }
  
  gl.applyFilters()

  await Promise.all([new Promise(window.requestAnimationFrame), new Promise(resolve => {
    // die early if there's an error
    gl.checkError()
    resolve(0)
  })])
}
