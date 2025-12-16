
const params = new URL(location).searchParams
const debugMode=params.get('debug')==='yes'

 const canvas = document.createElement('canvas')

 const gl = canvas.getContext('webgl2') // for gl_VertexID

gl.clearColor(0, 0, 0, 0.0);
gl.clear(gl.COLOR_BUFFER_BIT);

Object.assign(canvas.style, {
  bottom: 0,right:0,width:'100%',height:'100vh',
  pointerEvents:'none',position:'fixed'
})

const shaderV = gl.createShader( gl.VERTEX_SHADER );
gl.shaderSource(shaderV, `#version 300 es
  // ^ for bitwise

  
in vec2 a_position;
in mat2 a_transform;

out vec2 v_texcoord0;

void main() {

// gemini generated this

// 1. Extract X and Y from the gl_VertexID (0, 1, 2, 3)
    float x = float(gl_VertexID & 1); 
    float y = float((gl_VertexID >> 1) & 1);

    // 2. Convert from 0..1 space to -1..1 (NDC) space
    // Formula: coord * 2.0 - 1.0
    vec2 position = vec2(x, y) * 2.0 - 1.0;

    v_texcoord0 = position;

gl_Position  = vec4(a_position + a_transform *position , 0, 1);

}


  `);
		gl.compileShader(shaderV);
    if (!gl.getShaderParameter(shaderV, gl.COMPILE_STATUS)) {
console.error('fail to compile vertex shader', gl.getShaderInfoLog(shaderV))
    }

    
const shaderF = gl.createShader( gl.FRAGMENT_SHADER );
gl.shaderSource(shaderF, `#version 300 es
  precision mediump float;


  // uniform sampler2D u_texture;

  // in vec2 v_texcoord0;

  out vec4 color;


  void main() {

  color= vec4(1);// texture(u_texture, v_texcoord0);

}
  `);
		gl.compileShader(shaderF);
    if (!gl.getShaderParameter(shaderF, gl.COMPILE_STATUS)) {
console.error('fail to compile fragment shader', gl.getShaderInfoLog(shaderF))
    }

    const program = gl.createProgram();

    gl.attachShader(program, shaderV);
			gl.attachShader(program, shaderF);

      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('fail prgoram',gl.getProgramInfoLog(program));
      }

gl.useProgram(program);

function render () {
  gl.uniform2f(0,window.innerWidth,innerHeight)
}



// debugMode only for now
if (debugMode)
  document.body.append(canvas)



