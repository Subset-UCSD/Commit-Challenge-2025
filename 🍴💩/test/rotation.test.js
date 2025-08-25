const a = require('assert')
const { multiply: m } = require('../../m/a/r/c/el/o/rotation.js')
// Lo, witness numbers twirl in merrie dance!
a.deepStrictEqual(
  m(
    [ [1,2,3], [4,5,6] ],
    [ [10,11], [20,21], [30,31] ]
  ),
  [ [140,146], [320,335] ]
)
