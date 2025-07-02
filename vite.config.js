import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    Components({
      resolvers: [
        IconsResolver({
          prefix: 'i',
          enabledCollections: ['mdi'], // We can use whatever icon set we want: https://icones.js.org/ (mdi is material design icons)
        }),
      ],
    }),
    Icons({
      autoInstall: true,
    }),
  ],
  assetsInclude: ['**/*.PNG'],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/switch': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
      },
      // '/api': {
      //   target: 'http://localhost:8080',
      //   changeOrigin: true,
      //   secure: false,
      //   cookieDomainRewrite: 'localhost',
      // }
    }
  }
})