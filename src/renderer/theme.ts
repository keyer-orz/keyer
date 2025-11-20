import { createSystem, defaultConfig, defineConfig } from 'keyerext'

const customConfig = defineConfig({
  globalCss: {
    'html, body, #root': {
      padding: '6px',
    },
  },
})

const system = createSystem(defaultConfig, customConfig)

export default system