const identity = () => [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
]
const translate = (x, y) => [
  [1, 0, x],
  [0, 1, y],
  [0, 0, 1]
]
const rotate = angle => [
  [Math.cos(angle), -Math.sin(angle), 0],
  [Math.sin(angle), Math.cos(angle), 0],
  [0, 0, 1]
]
const dilate = scaleFactor => [
  [scaleFactor, 0, 0],
  [0, scaleFactor, 0],
  [0, 0, 1]
]
const toCss = ([
  [a, c, x],
  [b, d, y]
  // Third row is always 0 0 1
]) => `matrix(${a}, ${b}, ${c}, ${d}, ${x}, ${y})`

function multiply (matrix1, ...matrices) {
  if (matrices.length === 0) {
    return matrix1
  }
  const matrix2 = multiply(...matrices)
  if (matrix1[0].length !== matrix2.length) {
    throw new Error(
      `Left operand's row count (${matrix1[0].length}) is not equal to the right operand's column count (${matrix2.length}).`
    )
  }
  const product = Array.from(
    { length: matrix1.length },
    () => new Array(matrix2[0].length)
  )
  for (let row = 0; row < matrix1.length; row++) {
    for (let col = 0; col < matrix2[0].length; col++) {
      let sum = 0
      for (let i = 0; i < matrix2.length; i++) {
        sum += matrix1[row][i] * matrix2[i][col]
      }
      product[row][col] = sum
    }
  }
  return product
}
console.assert(
  multiply(
    [
      [1, 2, 3],
      [4, 5, 6]
    ],
    [
      [10, 11],
      [20, 21],
      [30, 31]
    ]
  ).toString() ===
    [
      [140, 146],
      [320, 335]
    ].toString(),
  'Multiplication is wrong'
)

let transformation = identity()

const wrapper = document.getElementById('wrapper')
const image = document.getElementById('map')
let pointer = null
wrapper.addEventListener('pointerdown', e => {
  if (pointer) {
    if (!pointer.other) {
      pointer = {
        ...pointer,
        initX: pointer.lastX,
        initY: pointer.lastY,
        transformation,
        other: {
          id: e.pointerId,
          initX: e.clientX,
          initY: e.clientY,
          lastX: e.clientX,
          lastY: e.clientY
        }
      }
      wrapper.setPointerCapture(e.pointerId)
    }
  } else {
    pointer = {
      id: e.pointerId,
      initX: e.clientX,
      initY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      transformation,
      other: null
    }
    wrapper.setPointerCapture(e.pointerId)
  }
})
let calledRotated = false
wrapper.addEventListener('pointermove', e => {
  if (pointer?.id === e.pointerId || pointer?.other?.id === e.pointerId) {
    if (pointer.id === e.pointerId) {
      pointer.lastX = e.clientX
      pointer.lastY = e.clientY
    } else {
      pointer.other.lastX = e.clientX
      pointer.other.lastY = e.clientY
    }
    if (pointer.other) {
      const rect = wrapper.getBoundingClientRect()
      const initXDiff = pointer.initX - pointer.other.initX
      const initYDiff = pointer.initY - pointer.other.initY
      const currentXDiff = pointer.lastX - pointer.other.lastX
      const currentYDiff = pointer.lastY - pointer.other.lastY
      // Difference between the angles of the initial and current line
      // between the pointers.
      const angleDiff =
        Math.atan2(currentYDiff, currentXDiff) -
        Math.atan2(initYDiff, initXDiff)
      // Distance between the pointers relative to their initial distance.
      const scale =
        Math.hypot(currentXDiff, currentYDiff) /
        Math.hypot(initXDiff, initYDiff)
      // Midpoint between the two pointers.
      const midX = (pointer.lastX + pointer.other.lastX) / 2
      const midY = (pointer.lastY + pointer.other.lastY) / 2
      // Offset of current midpoint from initial midpoint.
      const deltaX = midX - (pointer.initX + pointer.other.initX) / 2
      const deltaY = midY - (pointer.initY + pointer.other.initY) / 2
      // Centre of rotation/dilation
      const centreX = midX - (rect.left + rect.width / 2)
      const centreY = midY - (rect.top + rect.height / 2)
      transformation = multiply(
        // Rotate and scale around midpoint
        translate(centreX, centreY),
        rotate(angleDiff),
        dilate(scale),
        translate(-centreX, -centreY),
        translate(deltaX, deltaY),
        pointer.transformation
      )
    } else {
      transformation = multiply(
        translate(e.clientX - pointer.initX, e.clientY - pointer.initY),
        pointer.transformation
      )
    }
    image.style.transform = toCss(transformation)
    if (Math.abs(transformation[0][1]) > 0.7 && !calledRotated) {
      calledRotated = true
      onRotated()
    }
  }
})
const pointerEnd = e => {
  if (pointer?.id === e.pointerId) {
    if (pointer.other) {
      // Make the other pointer the primary pointer now
      pointer = {
        ...pointer.other,
        initX: pointer.other.lastX,
        initY: pointer.other.lastY,
        transformation,
        other: null
      }
    } else {
      pointer = null
    }
  } else if (pointer?.other?.id === e.pointerId) {
    pointer.initX = pointer.lastX
    pointer.initY = pointer.lastY
    pointer.other = null
    pointer.transformation = transformation
  }
}
wrapper.addEventListener('pointerup', pointerEnd)
wrapper.addEventListener('pointercancel', pointerEnd)
wrapper.addEventListener('wheel', e => {

  if (e.shiftKey) { // Check if Ctrl is being pressed
    const rect = wrapper.getBoundingClientRect()
    const centreX = e.clientX - (rect.left + rect.width / 2)
    const centreY = e.clientY - (rect.top + rect.height / 2)
    transformation = multiply(
      translate(centreX, centreY),
      // Thanks Roger!
      rotate(1.001 ** -e.deltaY),
      translate(-centreX, -centreY),
      transformation
    )
  }
  else {
    const rect = wrapper.getBoundingClientRect()
    const centreX = e.clientX - (rect.left + rect.width / 2)
    const centreY = e.clientY - (rect.top + rect.height / 2)
    transformation = multiply(
      translate(centreX, centreY),
      // Thanks Roger!
      dilate(1.001 ** -e.deltaY),
      translate(-centreX, -centreY),
      transformation
    )
  }

  
  image.style.transform = toCss(transformation)
  e.preventDefault()
})
