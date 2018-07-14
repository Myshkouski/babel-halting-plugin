const babel = require("babel-core")
const haltingPlugin = require('..')

let code = `
  do {} while(true)
`

code = babel.transform(code, {
  plugins: [
    haltingPlugin()
  ]
}).code

console.dir(code)
