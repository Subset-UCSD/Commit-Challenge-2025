precision mediump float;

varying vec3 v_position;
varying vec3 v_normal;
varying vec3 v_tangent;
varying vec2 v_texcoord0;
varying vec2 v_texcoord1;
varying vec2 v_texcoord2;
varying vec4 v_color0;

uniform vec4 u_base_color;
uniform sampler2D u_texture_color;
uniform int u_has_texture_color;
uniform float u_metallic;
uniform float u_roughness;
uniform sampler2D u_texture_metallic_roughness;
uniform int u_has_texture_metallic_roughness;
uniform sampler2D u_texture_normal;
uniform int u_has_texture_normal;
uniform sampler2D u_texture_occlusion;
uniform int u_has_texture_occlusion;
uniform sampler2D u_texture_emissive;
uniform int u_has_texture_emissive;
uniform vec3 u_emissive;
uniform float u_alpha_cutoff;

#define MAX_LIGHTS 8
uniform vec3 u_eye_pos;
uniform int u_num_lights;
uniform vec3 u_point_lights[MAX_LIGHTS];
// In HSV
uniform vec3 u_point_colors[MAX_LIGHTS];
// uniform samplerCube u_point_shadow_maps[MAX_LIGHTS];
uniform float u_falloff[MAX_LIGHTS];
uniform vec3 u_ambient_light;
uniform vec3 u_dir_light_color;
uniform vec3 u_dir_light_dir;
// uniform int u_enable_tones;
// uniform float u_tones;

#define NEAR 0.001
#define FAR 100.0
float zToDepth(float z) {
  // Convert distance from camera to depth value in [0, 1]
  // https://stackoverflow.com/a/10789527
  return ((FAR + NEAR) / (FAR - NEAR) - (2.0 * FAR * NEAR) / (FAR - NEAR) / z +
          1.0) *
         0.5;
}
float depthToZ(float depth) {
  // Convert [0, 1] depth value to distance from camera. ChatGPT-generated
  // inverse of `zToDepth`
  float A = (FAR + NEAR) / (FAR - NEAR) + 1.0;
  float B = 2.0 * FAR * NEAR / (FAR - NEAR);
  float local_z = B / (A - 2.0 * depth);
  return local_z;
}

// All components are in the range [0…1], including hue.
// https://stackoverflow.com/a/17897228
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// #define W -0.005
#define W 0.0

void main() {
  vec4 base_color =
      u_base_color *
      (u_has_texture_color == 1 ? texture2D(u_texture_color, v_texcoord0)
                                : vec4(1, 1, 1, 1)) *
      v_color0;
  float metallic =
      u_metallic * (u_has_texture_metallic_roughness == 1
                        ? texture2D(u_texture_metallic_roughness, v_texcoord1).b
                        : 1.0);
  float roughness =
      u_roughness *
      (u_has_texture_metallic_roughness == 1
           ? texture2D(u_texture_metallic_roughness, v_texcoord1).g
           : 1.0);
  vec3 emissive_color = u_emissive;

  vec3 to_eye = normalize(u_eye_pos - v_position);
  vec4 base_specular = vec4(0.5, 0.5, 0.5, 1.0);
  float shininess = 4.0;

  vec3 light = u_ambient_light + max(dot(u_dir_light_dir, v_normal), 0.0) * u_dir_light_color;
  gl_FragColor = vec4(light, 1.0) * base_color;
  
 for (int i = 0; i < MAX_LIGHTS; i++) {
   if (i >= u_num_lights) {
     break;
   }

   vec3 to_light = u_point_lights[i] - v_position;
   float distance = length(to_light);

   // Accurately read depth values from shadow map
   // https://stackoverflow.com/a/10789527
  //  vec3 abs_to_light = abs(to_light);
  //  float local_z = max(abs_to_light.x, max(abs_to_light.y, abs_to_light.z));
  //  float shadow_depth =
  //      textureCube(u_point_shadow_maps[i], -to_light / distance).r;
  //  if (1.0 - shadow_depth / zToDepth(local_z) > 0.00001 ||
  //      dot(v_normal, to_light / distance) < -0.05) {
  //    // occluded
  //    continue;
  //  }

   vec3 half_vector = normalize(to_light + to_eye);
   // Only adjust value (darkness) for HSV light color to avoid changing hue,
   // then convert to RGB
  //  if (u_enable_tones == 1) {
  //    distance = ceil(distance / u_tones) * u_tones;
  //  }
   distance /= u_falloff[i];
   vec4 light_color =
       vec4(hsv2rgb(vec3(u_point_colors[i].xy,
                         u_point_colors[i].z / (distance * distance))),
            1.0);
   vec4 diffuse_factor = light_color;
   vec4 diffuse = base_color * diffuse_factor;
   vec4 specular_factor =
       step(0.875, pow(max(dot(half_vector, v_normal), 0.0), shininess) *
                       light_color);
   vec4 specular = base_specular * specular_factor;

   gl_FragColor += diffuse; // + (u_enable_tones == 1 ? specular : vec4(0.0));
 }

  gl_FragColor += vec4(emissive_color, 0.0);

  if (base_color.a < u_alpha_cutoff) {
    discard;
  }
}
