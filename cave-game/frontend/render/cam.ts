import { mat4, vec3 } from "gl-matrix";

export class Camera {
  position = vec3.create()
  /** 
   * the first two are pitch and yaw but tbh i never remember which is which.
   * this is why i dont fly planes. it's easier to remember it as rotating
   * around axes tho
   * 
   * roll is rotating around z and it's like tilting your head side to side
   */
  rotation = {
    /** head shake, left/right */
    y: 0,
    /** head nod, up/down */
    x: 0,
    /** head tilt, "roll" */
    z: 0,
  }
  upDir = vec3.fromValues(0,1,0)
  /** based on screen height not width */
  fov = Math.PI / 3
  near = 0.01
  far = 100

  transform (): mat4 {
    const cameraTransform = mat4.create()
    mat4.translate(cameraTransform, cameraTransform, this.position)
    mat4.rotateY(cameraTransform, cameraTransform, this.rotation.y)
    mat4.rotateX(cameraTransform, cameraTransform, this.rotation.x)
    mat4.rotateZ(cameraTransform, cameraTransform, this.rotation.z)
    return cameraTransform
  }

  /** 
   * @param aspectRatio screen width / height
   * @returns projection * view matrix
   */
  pv (aspectRatio: number): mat4 {
    const view = mat4.invert(mat4.create(), this.transform())
		const perspective = mat4.perspective(mat4.create(), this.fov, aspectRatio, this.near, this.far);
		return mat4.multiply(mat4.create(), perspective, view);
  }
}
