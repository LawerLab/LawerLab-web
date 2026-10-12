<template>
	<input
		:value="displayValue"
		type="text"
		inputmode="decimal"
		class="h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 py-1 text-sm
			text-right tabular-nums outline-none transition-colors focus-visible:ring-2
			focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
		:placeholder="placeholder"
		@input="handleInput"
		@blur="handleBlur"
	/>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
	modelValue: { type: [Number, String], default: '' },
	placeholder: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

/** 输入过程中保留用户原始文本，失焦后再格式化 */
const draft = ref(null)

const displayValue = computed(() => {
	if (draft.value !== null) return draft.value
	const value = props.modelValue
	if (value === '' || value === null || value === undefined) return ''
	const number = Number(value)
	if (!Number.isFinite(number)) return String(value)
	return number.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
})

function handleInput(event) {
	const raw = event.target.value
	draft.value = raw
	const cleaned = raw.replace(/[,\s，]/g, '')
	if (cleaned === '') {
		emit('update:modelValue', '')
		return
	}
	const number = Number(cleaned)
	if (Number.isFinite(number)) emit('update:modelValue', number)
}

function handleBlur() {
	draft.value = null
}
</script>
