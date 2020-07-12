const definition = require('./package.json')
const dependencies = Object.keys(definition.dependencies)
import resolve from '@rollup/plugin-node-resolve';


export default {
  input: 'index',
  external: dependencies,
  plugins: [
	resolve({
    jsnext: true,
    module: true
  }),
  ],
  output: {
    extend: true,
    file: `dist/${definition.name}.js`,
    format: 'umd',
    globals: {
	  // lib name: name where lib exports itself on "window"
	  "d3": "d3",
      '@fortawesome/free-solid-svg-icons': 'free-solid-svg-icons',
    },
    name: 'd3'
  }
}
