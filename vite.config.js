import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import autoprefixer from 'autoprefixer'
import tailwind from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
	css: {
		postcss: {
			plugins: [autoprefixer()],
		},
	},
	plugins: [vue(), svgLoader(), tailwind()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
})
