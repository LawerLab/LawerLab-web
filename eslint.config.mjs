import js from '@eslint/js'
import globals from 'globals'
import vue from 'eslint-plugin-vue'

export default [
	{
		ignores: ['dist/**', 'node_modules/**', 'coverage/**', '.output/**'],
	},
	{
		files: ['**/*.{js,mjs,cjs}'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		rules: {
			...js.configs.recommended.rules,
			'no-shadow-restricted-names': 'off',
			'no-unused-vars': 'warn',
		},
	},
	...vue.configs['flat/recommended'],
	{
		files: ['**/*.vue'],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		rules: {
			'vue/attribute-hyphenation': 'off',
			'vue/attributes-order': 'off',
			'vue/html-self-closing': [
				'warn',
				{
					html: {
						void: 'any',
						normal: 'always',
						component: 'always',
					},
					svg: 'always',
					math: 'always',
				},
			],
			'vue/multi-word-component-names': 'off',
			'vue/no-use-v-if-with-v-for': 'warn',
			'vue/require-v-for-key': 'warn',
		},
	},
]
