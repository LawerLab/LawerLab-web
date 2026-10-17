/**
 * 借贷利息计算引擎
 *
 * 严格对齐 interest.py 的两套计算逻辑：
 *   - calculateRemainingPrincipalAndInterest        （v_punish = '2'，不算加倍利息）
 *   - calculateRemainingPrincipalAndInterestAndPunishment（v_punish = '1'，含加倍部分债务利息）
 *
 * 事件循环、天数计算（还款事件 +2 天、其它事件 +1 天）、
 * 还款冲抵顺序、2014-08-01 加倍利息规则切换均与原文件保持一致，
 * 额外产出「逐期明细」供页面表格使用。
 */
import {
	LPR_1Y,
	LPR_5Y,
	LOAN_RATE_6M,
	LOAN_RATE_1Y,
	LOAN_RATE_6M1Y,
	LOAN_RATE_1Y3Y,
	LOAN_RATE_1Y5Y,
	LOAN_RATE_3Y5Y,
	LOAN_RATE_5Y,
	PUNISH_FIXED_DAILY_RATE,
	PUNISH_RULE_CHANGE_DATE,
} from './rates.js'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** 利率方式：1 自定义固定利率，2 LPR，3 历史贷款基准利率 */
const RATE_MODE_FIXED = '1'
const RATE_MODE_LPR = '2'
const RATE_MODE_LOAN = '3'

/** 解析 'YYYY-M-D' / 'YYYY-MM-DD' 为 UTC 零点的日期 */
export function parseDate(value) {
	if (value instanceof Date) return new Date(value.getTime())
	if (typeof value !== 'string') return null
	const matched = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
	if (!matched) return null
	const year = Number(matched[1])
	const month = Number(matched[2])
	const day = Number(matched[3])
	if (month < 1 || month > 12 || day < 1 || day > 31) return null
	const date = new Date(Date.UTC(year, month - 1, day))
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return null
	}
	return date
}

export function addDays(date, days) {
	return new Date(date.getTime() + days * MS_PER_DAY)
}

export function daysBetween(from, to) {
	return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY)
}

/** 格式化为 YYYY-MM-DD */
export function formatDate(date) {
	if (!date) return ''
	const year = String(date.getUTCFullYear()).padStart(4, '0')
	const month = String(date.getUTCMonth() + 1).padStart(2, '0')
	const day = String(date.getUTCDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

/** 把利率表条目转成 { date, rate }，与原文件 sort_key 等价 */
function normalizeTable(table) {
	return table
		.map(([dateStr, rate]) => ({ date: parseDate(dateStr), rate }))
		.filter((item) => item.date)
}

/** 事件排序：日期 → 事件名 → 数值，等价于 Python 对元组排序 */
const EVENT_ORDER = {
	repayment: 0,
	new_principal: 1,
	lpr_change: 2,
	lpr_end: 3,
	punish_start: 4,
	a_punish_change: 5,
}

function compareEvents(left, right) {
	const diff = left.date.getTime() - right.date.getTime()
	if (diff !== 0) return diff
	const leftOrder = EVENT_ORDER[left.type] ?? 99
	const rightOrder = EVENT_ORDER[right.type] ?? 99
	if (leftOrder !== rightOrder) return leftOrder - rightOrder
	return Number(left.value) - Number(right.value)
}

/** 组装业务事件（还款、新增本金） */
function collectBusinessEvents(repaymentDates, repayments, newPrincipalDates, newPrincipals) {
	const events = []
	;(repaymentDates || []).forEach((dateStr, index) => {
		const date = parseDate(dateStr)
		if (!date) return
		events.push({ date, type: 'repayment', value: Number(repayments?.[index] ?? 0) })
	})
	;(newPrincipalDates || []).forEach((dateStr, index) => {
		const date = parseDate(dateStr)
		if (!date) return
		events.push({ date, type: 'new_principal', value: Number(newPrincipals?.[index] ?? 0) })
	})
	return events
}

/** 按利率方式追加利率变动事件，与 interest.py 的分支逐条对应 */
function appendRateEvents(events, rateMode, lprTerm, loanTerm) {
	if (rateMode === RATE_MODE_LPR) {
		const table = lprTerm === '2' ? LPR_5Y : LPR_1Y
		normalizeTable(table).forEach(({ date, rate }) => {
			events.push({ date, type: 'lpr_change', value: rate })
		})
		return
	}
	if (rateMode !== RATE_MODE_LOAN) return

	// [主表, 叠加表]，对应原文件中每个期限档的 for 循环序列：
	// 1) loan_rate_6m  + loan_rate_1y + lpr_1
	// 2) loan_rate_6m1y + loan_rate_1y + lpr_1
	// 3) loan_rate_1y3y + loan_rate_1y5y + lpr_1
	// 4) loan_rate_3y5y + loan_rate_1y5y + lpr_1
	// 5) loan_rate_5y   + lpr_5（不加 loan_rate_1y）
	const termTables = {
		1: [LOAN_RATE_6M, LOAN_RATE_1Y, LPR_1Y],
		2: [LOAN_RATE_6M1Y, LOAN_RATE_1Y, LPR_1Y],
		3: [LOAN_RATE_1Y3Y, LOAN_RATE_1Y5Y, LPR_1Y],
		4: [LOAN_RATE_3Y5Y, LOAN_RATE_1Y5Y, LPR_1Y],
		5: [LOAN_RATE_5Y, LPR_5Y],
	}
	const tables = termTables[loanTerm] || []
	tables.forEach((table) => {
		;[...table].forEach(([dateStr, rate]) => {
			const date = parseDate(dateStr)
			if (date) events.push({ date, type: 'lpr_change', value: rate })
		})
	})
}

/**
 * 定位「最后一个新增本金事件之前最近的一次利率变动」，作为初始利率。
 *
 * 原文件是在循环中对每个新增本金事件反复回扫并覆盖 current_lpr，
 * 因此最终生效的是**最后一个**新增本金事件往前找到的利率
 * （注意不是第一个——当存在多个新增本金事件时两者结果不同）。
 */
function resolveInitialRate(events, rateMode, entryRate) {
	if (rateMode === RATE_MODE_FIXED) {
		return Number(entryRate) / 100
	}
	if (rateMode !== RATE_MODE_LPR && rateMode !== RATE_MODE_LOAN) return null

	let resolved = null
	events.forEach((event, index) => {
		if (event.type !== 'new_principal') return
		for (let back = index - 1; back >= 0; back -= 1) {
			if (events[back].type === 'lpr_change') {
				resolved = events[back].value
				break
			}
		}
	})
	return resolved
}

function resolveRatio(rateMode, entryRatioLpr, entryRatioLoanRate) {
	if (rateMode === RATE_MODE_LPR) {
		return entryRatioLpr === '' || entryRatioLpr === null || entryRatioLpr === undefined
			? 1
			: Number(entryRatioLpr)
	}
	if (rateMode === RATE_MODE_LOAN) {
		return entryRatioLoanRate === '' ||
			entryRatioLoanRate === null ||
			entryRatioLoanRate === undefined
			? 1
			: Number(entryRatioLoanRate)
	}
	return 1
}

/** 日利率：r_value_1 = '1' 按 360 天，'2' 按 365 天 */
function dailyRate(currentRate, dayCountBasis) {
	if (dayCountBasis === '1') return currentRate / 360
	if (dayCountBasis === '2') return currentRate / 365
	return 0
}

/** 周期末日：计息事件为当天，还款事件为当天 +2 天 */
function periodEndDate(event) {
	return event.type === 'repayment' ? addDays(event.date, 2) : event.date
}

/** 计息天数：计息事件 +1 天 */
function periodDays(event, startDate, endDate) {
	const days = daysBetween(startDate, endDate)
	return event.type === 'repayment' ? days : days + 1
}

/**
 * 主入口
 * @param {object} args 与 interest.py 的 c(...) 参数同名
 * @returns {{principal: number, interest: number, punish: number, rows: Array, warnings: string[]}}
 */
export function calculateInterest(args) {
	const {
		end_date: endDateStr,
		v_punish: punishMode,
		punish_start_date: punishStartDateStr,
		values_repayment_date: repaymentDates,
		values_repayment: repayments,
		values_new_principal_date: newPrincipalDates,
		values_new_principal: newPrincipals,
		r_value_1: dayCountBasis,
		value_rate: rateMode,
		v_lpr: lprTerm,
		v_loan_rate: loanTerm,
		entry_ratio_lpr: entryRatioLpr,
		entry_ratio_loan_rate: entryRatioLoanRate,
		entry_rate: entryRate,
	} = args || {}

	const withPunish = punishMode === '1'
	const endDate = addDays(parseDate(endDateStr), 1)
	const punishStartDate = withPunish ? parseDate(punishStartDateStr) : null
	const ruleChangeDate = parseDate(PUNISH_RULE_CHANGE_DATE)

	const events = collectBusinessEvents(
		repaymentDates,
		repayments,
		newPrincipalDates,
		newPrincipals,
	)
	appendRateEvents(events, rateMode, lprTerm, loanTerm)
	events.push({ date: endDate, type: 'lpr_end', value: 0 })
	if (withPunish) {
		events.push({ date: punishStartDate, type: 'punish_start', value: 0 })
		events.push({ date: ruleChangeDate, type: 'a_punish_change', value: 0 })
	}
	events.sort(compareEvents)

	let principal = 0
	let currentRate = resolveInitialRate(events, rateMode, entryRate)
	let interestAccrued = 0
	let interestShouldBePaid = 0
	let punishAccrued = 0
	let punishShouldBePaid = 0
	let punishRate = 0
	let isPunishStarted = false
	let isPunishChanged = false
	const ratio = resolveRatio(rateMode, entryRatioLpr, entryRatioLoanRate)

	// 第一个业务事件的日期，作为计息起点；同时记住该事件本身
	let firstEventDate = null
	let startEvent = null
	for (const event of events) {
		if (event.type === 'new_principal' || event.type === 'repayment') {
			firstEventDate = event.date
			startEvent = event
			break
		}
	}
	let lastDate = firstEventDate
	// 对应原文件的 condition_met
	let accrualStarted = false
	const rows = []

	/**
	 * 结算「上一期 → 本事件」，并记录逐期明细。
	 *
	 * 两种模式的累计口径与原文件一致，但**不是同一个变量**：
	 *   - 非罚息：interest_accrued 自身跨期累加，并作为返回值；
	 *   - 罚息  ：interest_accrued 每期重算，累加进 interest_should_be_paid。
	 */
	function accruePeriod(event) {
		const startDate = lastDate
		const endDateOfPeriod = periodEndDate(event)
		const days = periodDays(event, startDate, endDateOfPeriod)
		const rate = dailyRate(currentRate, dayCountBasis)
		const appliedRate = currentRate
		const rowPrincipal = principal

		if (principal > 0) {
			if (withPunish) {
				interestAccrued = principal * rate * ratio * days
				interestShouldBePaid += interestAccrued
				if (isPunishChanged && isPunishStarted) {
					punishAccrued = principal * PUNISH_FIXED_DAILY_RATE * days
					punishShouldBePaid += punishAccrued
				} else if (isPunishStarted) {
					punishAccrued = (principal + interestShouldBePaid) * rate * 2 * days
					punishShouldBePaid += punishAccrued
				}
			} else {
				// 非罚息：interest_accrued 累加，interest_should_be_paid 同步用于展示
				interestAccrued += principal * rate * ratio * days
				interestShouldBePaid = interestAccrued
			}
		} else if (withPunish) {
			interestAccrued = 0
			punishAccrued = 0
		}

		// 明细表的「当期首日」= 本事件所属计息段的起始日
		rows.push({
			startDate: formatDate(startDate),
			endDate: formatDate(endDateOfPeriod),
			days,
			rate: appliedRate,
			principal: rowPrincipal,
			// 期初本金：本事件生效前的债务本金，对应原 Excel 的「当期应还债务本金」
			principalAtStart: rowPrincipal,
			interestAccrued,
			interestShouldBePaid,
			newPrincipal: event.type === 'new_principal' ? Number(event.value) : 0,
			repayment: event.type === 'repayment' ? Number(event.value) : 0,
			punishRate: withPunish && isPunishChanged && isPunishStarted ? PUNISH_FIXED_DAILY_RATE : 0,
			punishAccrued: withPunish ? punishAccrued : 0,
			punishShouldBePaid: withPunish ? punishShouldBePaid : 0,
			// 实还拆分与期末剩余，由事件处理写回（见下方）
			interestOwedBeforePayment: 0,
			interestPaid: 0,
			principalPaid: 0,
			interestRemaining: 0,
			principalRemaining: 0,
			punishPaid: 0,
			punishRemaining: withPunish ? punishShouldBePaid : 0,
			eventType: event.type,
		})
	}

	for (const event of events) {
		// 起始事件本身不结算（原文件用 event_date >= last_date 达到同一效果），
		// 但它仍要执行下面的业务处理（新增本金 / 还款）。
		// 起始事件通常不在数组首位——它前面可能有许多更早的利率变动事件——
		// 所以按对象身份判断，而不是按计数。
		const isStartEvent = event === startEvent

		// 对应原文件 for 循环开头的 "... and not condition_met" 分支：
		// 起始事件之后（按时间排序）的第一个事件，完成第一期的结算
		const wasStarted = accrualStarted
		if (!isStartEvent && !accrualStarted) {
			accruePeriod(event)
			accrualStarted = true
		}

		// 对应原文件的 "if condition_met" 分支（与上一分支在同一轮只会执行一次）
		if (wasStarted) {
			accruePeriod(event)
		}

		// 事件生效前的状态，用于写出「实还利息 / 实还本金 / 期末剩余」
		const owedInterestBefore = withPunish ? interestShouldBePaid : interestAccrued
		const principalBefore = principal
		const punishBefore = punishShouldBePaid

		if (event.type === 'repayment') {
			const amount = Number(event.value)
			if (withPunish) {
				if (event.date.getTime() >= ruleChangeDate.getTime()) {
					// 2014-08-01 起：先冲一般债务利息，再冲本金，最后冲加倍利息
					if (interestShouldBePaid >= amount) {
						interestShouldBePaid -= amount
					} else {
						const remaining = amount - interestShouldBePaid
						if (remaining < principal) {
							principal -= remaining
							interestShouldBePaid = 0
						} else {
							const overflow = remaining - principal
							punishShouldBePaid -= overflow
							principal = 0
						}
					}
				} else {
					// 2014-07-31 前：加倍利息按比例参与冲抵
					const total = principal + interestShouldBePaid + punishShouldBePaid
					const punishPaid = total > 0 ? (amount * punishShouldBePaid) / total : 0
					punishShouldBePaid -= punishPaid
					const remaining = amount - punishPaid
					if (interestShouldBePaid >= remaining) {
						interestShouldBePaid -= remaining
					} else {
						principal -= remaining - interestShouldBePaid
						interestShouldBePaid = 0
					}
				}
			} else if (interestAccrued >= amount) {
				// 非罚息：冲抵的是跨期累加的 interest_accrued
				interestAccrued -= amount
				interestShouldBePaid = interestAccrued
			} else {
				principal -= amount - interestAccrued
				interestAccrued = 0
				interestShouldBePaid = 0
			}
		} else if (event.type === 'new_principal') {
			principal += Number(event.value)
		} else if (event.type === 'lpr_change') {
			currentRate = Number(event.value)
		} else if (event.type === 'punish_start') {
			isPunishStarted = true
		} else if (event.type === 'a_punish_change') {
			isPunishChanged = true
		}

		// 把「实还拆分」与「期末剩余」写回本期的明细行
		const currentRow = rows[rows.length - 1]
		if (currentRow) {
			const owedInterestAfter = withPunish ? interestShouldBePaid : interestAccrued
			currentRow.interestOwedBeforePayment = owedInterestBefore
			currentRow.interestPaid = Math.max(owedInterestBefore - owedInterestAfter, 0)
			currentRow.principalPaid = Math.max(principalBefore - principal, 0)
			currentRow.interestRemaining = owedInterestAfter
			currentRow.principalRemaining = principal
			if (withPunish) {
				currentRow.punishPaid = Math.max(punishBefore - punishShouldBePaid, 0)
				currentRow.punishRemaining = punishShouldBePaid
			}
		}

		if (isPunishStarted && isPunishChanged) {
			punishRate = PUNISH_FIXED_DAILY_RATE
		}

		// 计息开始前的利率事件不推进 last_date，让它保持为起始事件的日期；
		// 起始事件本身与之后的事件正常推进（起始事件把它推进到起始日 +1 天，
		// 即第一期的第一天）。
		if (accrualStarted || isStartEvent) {
			lastDate = event.type === 'repayment' ? addDays(event.date, 2) : addDays(event.date, 1)
		}

		if (event.type === 'lpr_end') break
	}

	// 只保留真正参与计息的期次：
	// 起始事件那条占位行（天数为负）以及同日事件产生的零天行都不展示，
	// 原文件的 Excel 输出同样不会写出这些行。
	const periods = rows.filter((row) => row.days > 0)

	// 非罚息函数返回的第二个值是跨期累加的 interest_accrued，与罚息模式不同
	const finalInterest = withPunish ? interestShouldBePaid : interestAccrued

	const result = {
		principal: round2(principal),
		interest: round2(finalInterest),
		rows: periods,
	}
	if (withPunish) {
		result.punish = round2(punishShouldBePaid)
		result.punishTotal = round2(principal + interestShouldBePaid + punishShouldBePaid)
	} else {
		result.punish = 0
		result.punishTotal = round2(principal + finalInterest)
	}
	return result
}

function round2(value) {
	return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

/** 与 Python f"{value:.2f}" 一致的格式化（保留两位小数） */
export function toFixed2(value) {
	const number = Number(value)
	if (!Number.isFinite(number)) return '0.00'
	return number.toFixed(2)
}

/** 便于页面与测试复用的默认参数 */
export function createDefaultArgs() {
	const today = new Date()
	return {
		end_date: formatDate(today),
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
