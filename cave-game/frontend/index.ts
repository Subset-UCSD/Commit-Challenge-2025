/**
 * 🎉 this is the main entry point of the frontend, analogous to Game.ts
 * 
 * it is more like a script than a proper class, with global state etc., because it deals directly with the DOM
 *
 */

import { ServerMessage } from "../communism/messages";
import { send } from "./net";
import './index.css'
import { expect, FUCK, mergeVec3 } from "../communism/utils";
import { Gl } from "./render/Gl";
import { GltfModel } from "./render/Glthefuck";
import interpolate from 'mat4-interpolate'

console.log('frontend!')

//#region temp chat
const ul = document.createElement('ul')
document.body.append(ul)

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



//#region server message handling
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


//#region ACTUAL  msg handler
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
    case 'chats': {
      const frag = document.createDocumentFragment()
      for (const content of message.contents) {
        const li = document.createElement('li')
      li.style.whiteSpace = 'pre-wrap'
      li.append(content)
      frag.prepend(li)
      }
      ul.prepend(frag)
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

export function handleConnectionStatus (areWeConnected: boolean) {
  (document.querySelector('#f input') as FUCK).disabled = !areWeConnected
  ;;;;
  (document.querySelector('#f button') as FUCK).disabled = !areWeConnected
}
handleConnectionStatus(false)

//#region input

let keys = new Set<string>()
window.addEventListener('keydown', e => {

  if (!keys.has(e.code)) {
    keys.add(e.code)
    send({type:'key-state-update',keys:[...keys]})
  }
})
window.addEventListener('keyup', e => {
  if (keys.has(e.code)) {
    keys.delete(e.code)
    send({type:'key-state-update',keys:[...keys]})
  }
})
window.addEventListener('blur', e => {
if (keys.size > 0){
  keys = new Set()
  send({type:'key-state-update',keys:[...keys]})
} 
})

//#region rendering
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
cam.position[2] = 20 // (Math.sin(now / 1248) + 1) * (25-3)/2 + 3
cam.position[1] = 20
cam.rotation.x = -Math.PI / 8
// cam.rotation.y = Math.PI

import modelGlb from '../public/marcelos/notacube.glb'
import modelGlb2 from '../public/marcelos/notacube_smooth.glb'
import { mat4, vec3, vec4 } from "gl-matrix";
import { Camera } from "./render/cam";
import { parseGlb } from "../communism/gltf/bingltfparser";
const model = new GltfModel(gl, await fetch(modelGlb).then(r => r.arrayBuffer()).then(parseGlb))
const model2 = new GltfModel(gl, await fetch(modelGlb2).then(r => r.arrayBuffer()).then(parseGlb))

gl.checkError()

type PointLight = {
  position: vec3
  color: [r: number, g: number, b: number]
  falloff: number
}
const lights: PointLight[] = [
  { position: vec3.fromValues(10, 2, 0), color: [0 / 360, 0.8, 0.5], falloff: 10 },
  { position: vec3.fromValues(-10, 2, 0), color: [180 / 360, 0.8, 0.5], falloff: 10 }
]

//#region rendering: main game loop
while (true) {
  const now = Date.now()

  const view = cam.pv(window.innerWidth / window.innerHeight)

  gl.clear([0.01,0.02,0.1])
  gl.beginRender()

  gl.gltfShader.use()
  gl.gl.uniformMatrix4fv(gl.gltfShader.uniform('u_view'), false, view)
  gl.gl.uniform3f(gl.gltfShader.uniform('u_ambient_light'), 0.5, 0.5, 0.5)
  gl.gl.uniform3f(gl.gltfShader.uniform('u_dir_light_color'), 2, 2, 2)
  gl.gl.uniform3fv(gl.gltfShader.uniform('u_dir_light_dir'), vec3.normalize(vec3.create(), vec3.fromValues(Math.cos(now / 362), Math.sin(now / 362), 1)))//, cam.transform()).slice(0, 3))
  // console.log(vec4.transformMat4(vec4.create(), vec4.normalize(vec4.create(), vec4.fromValues(Math.cos(now / 362), Math.sin(now / 362), 5, 0)), mat4.invert(mat4.create(), cam.transform())).slice(0, 3))
  // console.log(vec4.normalize(vec4.create(), vec4.fromValues(Math.cos(now / 362), Math.sin(now / 362), 5, 0)),cam.transform())
  // break
  gl.gl.uniform3fv(gl.gltfShader.uniform("u_eye_pos"), cam.position);
	gl.gl.uniform1i(gl.gltfShader.uniform("u_num_lights"), lights.length);
	if (lights.length > 0) {
		gl.gl.uniform3fv(gl.gltfShader.uniform("u_point_lights[0]"), mergeVec3(lights.map(light => light.position)));
		gl.gl.uniform3fv(gl.gltfShader.uniform("u_point_colors[0]"), mergeVec3(lights.map(light => light.color)));
		gl.gl.uniform1fv(
			gl.gltfShader.uniform("u_falloff[0]"),
			Array.from(lights.values(), (light) => light.falloff),
		);
	}
	gl.gl.uniform1iv(
		gl.gltfShader.uniform("u_point_shadow_maps[0]"),
		Array.from({ length: +gl.constants.MAX_LIGHTS }).map((_, i) => 4 + i),
	);
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
