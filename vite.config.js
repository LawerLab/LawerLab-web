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
	server: {
		watch: {
			// 本地验证工具的产物（导出的 xlsx、临时浏览器 profile 等）不应触发重载，
			// 其中被外部进程锁定的文件会让 watcher 抛 EBUSY 并终止 dev server。
			ignored: ['**/.dsh-verify/**'],
		},
	},
})
