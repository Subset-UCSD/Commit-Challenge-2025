//https://medium.com/my-games-company/migrating-from-webgl-to-webgpu-057ae180f896
//https://github.com/gfx-rs/wgpu/tree/trunk
//https://discourse.threejs.org/t/the-new-webgl-vs-webgpu-performance-comparison-example/69097
//https://www.reddit.com/r/GraphicsProgramming/comments/15og3al/should_i_shift_from_webgl_to_opengl_or_webgpu/
/**
 * 
 * Okay based on my reading, webGPU maybe the play. 
 * 
 * It might be faster, and more modern. A lot of movement in the felid is toward it
 * 
 * The largest downside is I'm not sure we can easily convert the old rendering pipeline to it
 * and I am not the biggest fan of WSGL's syntax. I pefer GSGL. 
 * 
 * We can use a tool called naga to convert between the two shader langagues, its supported by wgpu. 
 * But I worry that may cause performance issues as opposed to rendering it ourselfs. 
 * 
 * Other downside, limited browser support:
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API#browser_compatibility 
 * 
 * Ahhh idk, WebGL maybe the best in short term, I might try and learn both and see where it leads
 * For learning sake u know
 */




//https://developer.mozilla.org/en-US/docs/Web/API/GPUShaderModule
//https://webgpufundamentals.org/webgpu/lessons/webgpu-from-webgl.html 
// GOAL: Learn how WebGPU works yippee - sean
// also typescript believe it or not i've never used it before





// Clear color for GPURenderPassDescriptor
const clearColor = { r: 0.0, g: 0.5, b: 1.0, a: 1.0 };

// Vertex data for triangle
// Each vertex has 8 values representing position and color: X Y Z W R G B A

const vertices = new Float32Array([
  0.0,  0.6, 0, 1, 1, 0, 0, 1,
 -0.5, -0.6, 0, 1, 0, 1, 0, 1,
  0.5, -0.6, 0, 1, 0, 0, 1, 1
]);

// Vertex and fragment shaders

const shaders = `
struct VertexOut {
  @builtin(position) position : vec4f,
  @location(0) color : vec4f
}

@vertex
fn vertex_main(@location(0) position: vec4f,
               @location(1) color: vec4f) -> VertexOut
{
  var output : VertexOut;
  output.position = position;
  output.color = color;
  return output;
}

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
{
  return fragData.color;
}
`;

// Main function

async function init() {
  // 1: request adapter and device
  if (!navigator.gpu) {
    throw Error('WebGPU not supported.');
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw Error('Couldn\'t request WebGPU adapter.');
  }

  let device = await adapter.requestDevice();

  // 2: Create a shader module from the shaders template literal
  const shaderModule = device.createShaderModule({
    code: shaders
  });

  // 3: Get reference to the canvas to render on
  const canvas: HTMLCanvasElement = document.querySelector('#gpuCanvas');
  const context = canvas.getContext('webgpu');

  if (context === null) {
    alert("no GPU found")
    return;
  }

  context.configure({
    device: device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: 'premultiplied'
  });

  // 4: Create vertex buffer to contain vertex data
  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength, // make it big enough to store vertices in
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  // Copy the vertex data over to the GPUBuffer using the writeBuffer() utility function
  device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);

  // 5: Create a GPUVertexBufferLayout and GPURenderPipelineDescriptor to provide a definition of our render pipline
  const vertexBuffers = [{
    attributes: [{
      shaderLocation: 0, // position
      offset: 0,
      format: 'float32x4'
    }, {
      shaderLocation: 1, // color
      offset: 16,
      format: 'float32x4'
    }],
    arrayStride: 32,
    stepMode: 'vertex'
  }];

  const pipelineDescriptor = {
    vertex: {
      module: shaderModule,
      entryPoint: 'vertex_main',
      buffers: vertexBuffers
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragment_main',
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat()
      }]
    },
    primitive: {
      topology: 'triangle-list'
    },
    layout: 'auto'
  };

  // 6: Create the actual render pipeline

  const renderPipeline = device.createRenderPipeline(pipelineDescriptor);
    
  // 7: Create GPUCommandEncoder to issue commands to the GPU
  // Note: render pass descriptor, command encoder, etc. are destroyed after use, fresh one needed for each frame.
  const commandEncoder = device.createCommandEncoder();

  // 8: Create GPURenderPassDescriptor to tell WebGPU which texture to draw into, then initiate render pass

  const renderPassDescriptor = {
    colorAttachments: [{
      clearValue: clearColor,
      loadOp: 'clear',
      storeOp: 'store',
      view: context.getCurrentTexture().createView()
    }]
  };

  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    
  // 9: Draw the triangle

  passEncoder.setPipeline(renderPipeline);
  passEncoder.setVertexBuffer(0, vertexBuffer);
  passEncoder.draw(3);

  // End the render pass
  passEncoder.end();

  // 10: End frame by passing array of command buffers to command queue for execution
  device.queue.submit([commandEncoder.finish()]);
}

init();