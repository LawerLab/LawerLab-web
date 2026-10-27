<template>
	<div class="page-interest">
		<div class="title text-3xl text-center m-5 font-semibold">借贷利息计算</div>
		<div class="subtitle text-sm text-center text-muted-foreground -mt-3 mb-6">
			支持 LPR、历史贷款基准利率与自定义利率，可计加倍部分债务利息（迟延履行期间）
		</div>

		<div class="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)] items-start">
			<!-- 查询条件 -->
			<Card class="lg:sticky lg:top-20">
				<CardHeader class="pb-3">
					<CardTitle class="text-base">查询条件</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="grid grid-cols-2 gap-3">
						<label class="field">
							<span class="field-label">计算截止日</span>
							<input v-model="form.end_date" type="date" class="field-input" />
						</label>
						<label class="field">
							<span class="field-label">是否计罚息</span>
							<select v-model="form.v_punish" class="field-input">
								<option value="1">计算加倍债务利息</option>
								<option value="2">不计加倍债务利息</option>
							</select>
						</label>
					</div>

					<label v-if="form.v_punish === '1'" class="field">
						<span class="field-label">加倍利息起算日</span>
						<input v-model="form.punish_start_date" type="date" class="field-input" />
					</label>

					<div class="grid grid-cols-2 gap-3">
						<label class="field">
							<span class="field-label">利率方式</span>
							<select v-model="form.value_rate" class="field-input">
								<option v-for="item in RATE_METHODS" :key="item.value" :value="item.value">
									{{ item.label }}
								</option>
							</select>
						</label>
						<label class="field">
							<span class="field-label">计息基数</span>
							<select v-model="form.r_value_1" class="field-input">
								<option value="1">年 / 360 天</option>
								<option value="2">年 / 365 天</option>
							</select>
						</label>
					</div>

					<template v-if="form.value_rate === '2'">
						<label class="field">
							<span class="field-label">LPR 期限</span>
							<select v-model="form.v_lpr" class="field-input">
								<option v-for="item in LPR_TERMS" :key="item.value" :value="item.value">
									{{ item.label }}
								</option>
							</select>
						</label>
						<label class="field">
							<span class="field-label">利率倍率（如 1.5 即 1.5 倍 LPR）</span>
							<input v-model="form.entry_ratio_lpr" type="number" step="0.01" min="0" class="field-input" />
						</label>
					</template>

					<template v-else-if="form.value_rate === '3'">
						<label class="field">
							<span class="field-label">借款期限档</span>
							<select v-model="form.v_loan_rate" class="field-input">
								<option v-for="item in LOAN_TERMS" :key="item.value" :value="item.value">
									{{ item.label }}
								</option>
							</select>
						</label>
						<label class="field">
							<span class="field-label">利率倍率</span>
							<input
								v-model="form.entry_ratio_loan_rate"
								type="number"
								step="0.01"
								min="0"
								class="field-input"
							/>
						</label>
					</template>

					<label v-else class="field">
						<span class="field-label">年利率（%）</span>
						<input v-model="form.entry_rate" type="number" step="0.01" min="0" class="field-input" />
					</label>

					<!-- 新增本金 -->
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<span class="field-label mb-0">新增本金</span>
							<button type="button" class="icon-btn" title="添加一行" @click="addNewPrincipal()">
								<span class="material-icons text-lg">add_circle_outline</span>
							</button>
						</div>
						<div v-if="!form.values_new_principal_date.length" class="empty-hint">
							尚未添加，本金为 0 时不会产生利息
						</div>
						<div
							v-for="(_, index) in form.values_new_principal_date"
							:key="'p' + index"
							class="row-line"
						>
							<input v-model="form.values_new_principal_date[index]" type="date" class="field-input" />
							<MoneyInput v-model="form.values_new_principal[index]" placeholder="金额" />
							<button type="button" class="icon-btn" title="删除" @click="removeNewPrincipal(index)">
								<span class="material-icons text-lg">remove_circle_outline</span>
							</button>
						</div>
					</div>

					<!-- 还款记录 -->
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<span class="field-label mb-0">还款记录</span>
							<button type="button" class="icon-btn" title="添加一行" @click="addRepayment()">
								<span class="material-icons text-lg">add_circle_outline</span>
							</button>
						</div>
						<div v-if="!form.values_repayment_date.length" class="empty-hint">尚未添加</div>
						<div v-for="(_, index) in form.values_repayment_date" :key="'r' + index" class="row-line">
							<input v-model="form.values_repayment_date[index]" type="date" class="field-input" />
							<MoneyInput v-model="form.values_repayment[index]" placeholder="金额" />
							<button type="button" class="icon-btn" title="删除" @click="removeRepayment(index)">
								<span class="material-icons text-lg">remove_circle_outline</span>
							</button>
						</div>
					</div>

					<div class="flex gap-2 pt-1">
						<Button class="flex-1" @click="runCalculate">开始计算</Button>
						<Button variant="outline" @click="resetForm">重置</Button>
					</div>
					<Button
						variant="outline"
						class="w-full"
						:disabled="!result || isExporting"
						@click="exportExcel"
					>
						<span class="material-icons text-base mr-1">download</span>
						{{ isExporting ? '正在导出…' : '导出 Excel 表格' }}
					</Button>
				</CardContent>
			</Card>

			<!-- 结果 -->
			<div class="space-y-4 min-w-0">
				<div
					v-if="errorMessage"
					class="rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-sm px-4 py-3"
				>
					{{ errorMessage }}
				</div>

				<Card v-if="result">
					<CardHeader class="pb-3">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<CardTitle class="text-base flex items-center gap-2">
									计算结果
									<Badge variant="secondary">{{ modeLabel }}</Badge>
								</CardTitle>
								<CardDescription>
									截止日 {{ form.end_date }} · 明细 {{ periodRows.length }} 个计息期
								</CardDescription>
							</div>
							<Button
								variant="outline"
								class="shrink-0"
								:disabled="isExporting"
								@click="exportExcel"
							>
								<span class="material-icons text-base mr-1">
									{{ isExporting ? 'hourglass_top' : 'download' }}
								</span>
								{{ isExporting ? '正在导出…' : '导出 Excel' }}
							</Button>
						</div>
						<p v-if="exportMessage" class="text-xs text-green-600 mt-2">
							{{ exportMessage }}
						</p>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
							<div v-for="tile in summaryTiles" :key="tile.label" class="summary-tile">
								<div class="text-xs text-muted-foreground">{{ tile.label }}</div>
								<div class="text-xl font-semibold tabular-nums mt-1">
									{{ tile.value }}
									<span class="text-xs font-normal text-muted-foreground ml-1">元</span>
								</div>
							</div>
						</div>

						<div class="rounded-lg border p-3 flex items-baseline gap-2">
							<span class="text-sm text-muted-foreground">{{ totalLabel }}</span>
							<span class="text-2xl font-bold tabular-nums text-primary">
								{{ toFixed2(result.punishTotal) }}
							</span>
							<span class="text-sm text-muted-foreground">元</span>
						</div>
					</CardContent>
				</Card>

				<Card v-if="result && result.rows.length">
					<CardHeader class="pb-3">
						<CardTitle class="text-base">逐期明细</CardTitle>
						<CardDescription>
							年利率为当期适用的分段利率；还款事件按「先冲一般债务利息、再冲本金」处理
						</CardDescription>
					</CardHeader>
					<CardContent class="p-0 pb-4">
						<div class="overflow-x-auto">
							<table class="period-table">
								<thead>
									<tr>
										<th>当期首日</th>
										<th>当期末日</th>
										<th class="num">计息天数</th>
										<th class="num">年利率</th>
										<th class="num">当期应还本金</th>
										<th class="num">当期新增本金</th>
										<th class="num">还款金额</th>
										<th class="num">当期一般利息</th>
										<th class="num">剩余应还一般利息</th>
										<th v-if="withPunish" class="num">当期加倍利息</th>
										<th v-if="withPunish" class="num">剩余应还加倍利息</th>
										<th>事件</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="(row, index) in periodRows" :key="index">
										<td class="tabular-nums">{{ row.startDate }}</td>
										<td class="tabular-nums">{{ row.endDate }}</td>
										<td class="num tabular-nums">{{ row.days }}</td>
										<td class="num tabular-nums">{{ formatRate(row.rate) }}</td>
										<td class="num tabular-nums">{{ toFixed2(row.principal) }}</td>
										<td class="num tabular-nums">
											{{ row.newPrincipal ? toFixed2(row.newPrincipal) : '—' }}
										</td>
										<td class="num tabular-nums">
											{{ row.repayment ? toFixed2(row.repayment) : '—' }}
										</td>
										<td class="num tabular-nums">{{ toFixed2(row.interestAccrued) }}</td>
										<td class="num tabular-nums">{{ toFixed2(row.interestShouldBePaid) }}</td>
										<template v-if="withPunish">
											<td class="num tabular-nums">
												{{ row.punishAccrued ? toFixed2(row.punishAccrued) : '—' }}
											</td>
											<td class="num tabular-nums">{{ toFixed2(row.punishShouldBePaid) }}</td>
										</template>
										<td class="whitespace-nowrap text-muted-foreground text-xs">
											{{ eventLabels(row) }}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>

				<Card v-if="!result && !errorMessage">
					<CardContent class="py-16 text-center text-muted-foreground text-sm">
						填写左侧条件后点击「开始计算」<br />
						<span class="text-xs">
							利率数据表已内置 LPR 与 1991 年以来的贷款基准利率，无需手工录入
						</span>
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import MoneyInput from '@/components/MoneyInput.vue'
import { LPR_TERMS, LOAN_TERMS, RATE_METHODS } from '@/lib/interest/rates.js'
import { calculateInterest, toFixed2 } from '@/lib/interest/calculate.js'

/** 与 interest.py 的 c(...) 参数同名的表单模型 */
function createForm() {
	return {
		end_date: '',
		v_punish: '1',
		punish_start_date: '',
		values_repayment_date: [],
		values_repayment: [],
		values_new_principal_date: [],
		values_new_principal: [],
		r_value_1: '1',
		value_rate: '2',
		v_lpr: '1',
		v_loan_rate: '1',
		entry_ratio_lpr: '1',
		entry_ratio_loan_rate: '1',
		entry_rate: '',
	}
}

/** 预填一组示例数据，便于直接体验 */
function createSampleForm() {
	return {
		...createForm(),
		end_date: '2025-06-30',
		punish_start_date: '2023-01-01',
		values_new_principal_date: ['2022-01-10', '2023-03-05'],
		values_new_principal: [200000, 100000],
		values_repayment_date: ['2023-06-01', '2024-01-15'],
		values_repayment: [50000, 30000],
		entry_ratio_lpr: '1.5',
	}
}

const form = reactive(createSampleForm())
const result = ref(null)
const errorMessage = ref('')

const withPunish = computed(() => form.v_punish === '1')

/**
 * 明细直接展示引擎产出的区间。
 * 引擎已按业务口径重排日期（开期事件作首日、还款与截止作末日、区间连续），
 * 并剔除了放款前的空档期，因此页面与 Excel 导出的行完全一致。
 */
const periodRows = computed(() => (result.value ? result.value.rows : []))

const modeLabel = computed(() => {
	const found = RATE_METHODS.find((item) => item.value === form.value_rate)
	return found ? found.label : ''
})

const totalLabel = computed(() =>
	withPunish.value ? '应还本息及加倍利息合计' : '应还本息合计',
)

const summaryTiles = computed(() => {
	if (!result.value) return []
	const tiles = [
		{ label: withPunish.value ? '剩余债务本金' : '剩余本金', value: toFixed2(result.value.principal) },
		{ label: '剩余应还一般债务利息', value: toFixed2(result.value.interest) },
	]
	if (withPunish.value) {
		tiles.push({ label: '剩余应还加倍部分债务利息', value: toFixed2(result.value.punish) })
	}
	tiles.push({ label: '计息期数', value: String(periodRows.value.length) })
	return tiles
})

const EVENT_LABELS = {
	repayment: '还款',
	new_principal: '新增本金',
	lpr_change: '利率调整',
	lpr_end: '计算截止',
	punish_start: '加倍利息起算',
	a_punish_change: '加倍利息规则变更',
}

function eventLabel(type) {
	return EVENT_LABELS[type] || type
}

/**
 * 一行的「事件」列可能包含多个事件（例如一期之内既有新增本金又有还款），
 * 引擎会给出 eventTypes 数组，这里按顺序用顿号连接。
 * 空数组表示该期没有发生事件（例如还款之后到下一个利率调整日之间的过渡期）。
 */
function eventLabels(row) {
	const types = Array.isArray(row.eventTypes)
		? row.eventTypes
		: row.eventType
			? [row.eventType]
			: []
	if (!types.length) return '—'
	return types.map(eventLabel).join('、')
}

function formatRate(rate) {
	if (rate === null || rate === undefined || !Number.isFinite(Number(rate))) return '—'
	return (Number(rate) * 100).toFixed(4).replace(/0+$/, '').replace(/\.$/, '') + '%'
}

function addNewPrincipal() {
	form.values_new_principal_date.push('')
	form.values_new_principal.push('')
}

function removeNewPrincipal(index) {
	form.values_new_principal_date.splice(index, 1)
	form.values_new_principal.splice(index, 1)
}

function addRepayment() {
	form.values_repayment_date.push('')
	form.values_repayment.push('')
}

function removeRepayment(index) {
	form.values_repayment_date.splice(index, 1)
	form.values_repayment.splice(index, 1)
}

function resetForm() {
	Object.assign(form, createForm())
	result.value = null
	errorMessage.value = ''
}

/** 校验并计算：错误信息沿用原文件的「错误：…」风格 */
function runCalculate() {
	errorMessage.value = ''
	result.value = null

	if (!form.end_date) {
		errorMessage.value = '错误：请填写计算截止日'
		return
	}
	if (withPunish.value && !form.punish_start_date) {
		errorMessage.value = '错误：计算加倍部分债务利息时必须填写起算日'
		return
	}
	if (form.value_rate === '1' && !form.entry_rate) {
		errorMessage.value = '错误：请填写年利率'
		return
	}
	const hasNewPrincipal = form.values_new_principal_date.some(
		(date, index) => date && Number(form.values_new_principal[index]) > 0,
	)
	if (!hasNewPrincipal) {
		errorMessage.value = '错误：请至少填写一笔新增本金'
		return
	}

	try {
		result.value = calculateInterest({ ...form })
	} catch (error) {
		errorMessage.value = `错误：${error.message}`
	}
}

/** 导出状态 */
const isExporting = ref(false)
const exportMessage = ref('')

/**
 * 导出 Excel。
 * exceljs 体积较大，这里用动态 import：只有用户点击导出时才加载该模块，
 * 不影响页面首屏。
 */
async function exportExcel() {
	if (!result.value || isExporting.value) return
	isExporting.value = true
	exportMessage.value = ''
	try {
		const { downloadWorkbook } = await import('@/lib/interest/workbook.js')
		const fileName = await downloadWorkbook({
			result: result.value,
			form: { ...form },
			labels: { rateMode: modeLabel.value },
		})
		exportMessage.value = `已导出 ${fileName}`
	} catch (error) {
		errorMessage.value = `导出失败：${error.message}`
	} finally {
		isExporting.value = false
	}
}

runCalculate()
</script>

<style scoped>
.field {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}
.field-label {
	font-size: 0.75rem;
	line-height: 1rem;
	color: hsl(var(--muted-foreground));
	margin-bottom: 0.25rem;
}
.field-input {
	height: 2.25rem;
	width: 100%;
	min-width: 0;
	border-radius: calc(var(--radius) - 2px);
	border: 1px solid hsl(var(--input));
	background-color: hsl(var(--background));
	padding: 0.25rem 0.5rem;
	font-size: 0.875rem;
	line-height: 1.25rem;
	outline: none;
	transition: box-shadow 0.15s ease, border-color 0.15s ease;
}
.field-input:focus-visible {
	box-shadow: 0 0 0 2px hsl(var(--ring));
}
.field-input:disabled {
	cursor: not-allowed;
	opacity: 0.5;
}
.empty-hint {
	font-size: 0.75rem;
	line-height: 1rem;
	color: hsl(var(--muted-foreground));
}
.row-line {
	display: flex;
	align-items: center;
	gap: 0.375rem;
}
.icon-btn {
	display: flex;
	height: 2.25rem;
	width: 2.25rem;
	flex-shrink: 0;
	align-items: center;
	justify-content: center;
	border-radius: calc(var(--radius) - 2px);
	color: hsl(var(--muted-foreground));
	transition: background-color 0.15s ease, color 0.15s ease;
}
.icon-btn:hover {
	background-color: hsl(var(--accent));
	color: hsl(var(--accent-foreground));
}
.summary-tile {
	border-radius: var(--radius);
	border: 1px solid hsl(var(--border));
	padding: 0.75rem;
}
.period-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.875rem;
	line-height: 1.25rem;
}
.period-table th {
	white-space: nowrap;
	border-bottom: 1px solid hsl(var(--border));
	background-color: hsl(var(--muted) / 0.5);
	padding: 0.5rem 0.75rem;
	text-align: left;
	font-weight: 500;
	color: hsl(var(--muted-foreground));
}
.period-table td {
	white-space: nowrap;
	border-bottom: 1px solid hsl(var(--border));
	padding: 0.5rem 0.75rem;
}
.period-table .num {
	text-align: right;
}
.period-table tbody tr:hover {
	background-color: hsl(var(--muted) / 0.4);
}
</style>
