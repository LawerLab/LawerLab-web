/**
 * 根据计算结果生成 Excel 工作簿。
 *
 * 版面与原 interest.py 导出的明细表保持一致：
 *   标题 → 案件信息 → 汇总结果 → 逐期明细表 → 合计行
 * 金额两位小数、利率用百分比、并设置列宽与表头样式。
 *
 * 列序严格对齐原文件的 14 列（不计罚息）/ 18 列（计罚息）：
 *   当期首日、当期末日、计息天数、年利率、
 *   [加倍利息日利率]、当期新增本金、还款金额、[产生加倍利息]、[应还加倍利息]、
 *   当期应还债务本金、当期产生一般利息、当期应还一般利息、
 *   当期实还一般利息、当期实还债务本金、当期剩余一般利息、当期剩余债务本金
 *
 * 本模块不依赖 DOM，可在 Node 中直接调用（便于生成后回读校验）；
 * 浏览器侧由页面动态 import，因此不会进入首屏包体。
 */
import ExcelJS from 'exceljs'

/** 不计罚息时的列定义（14 列，与原文件一致） */
const BASE_COLUMNS = [
	{ header: '当期首日', key: 'startDate', width: 12.5, numFmt: '@' },
	{ header: '当期末日（还款日）', key: 'endDate', width: 18, numFmt: '@' },
	{ header: '计息天数', key: 'days', width: 10, numFmt: '0' },
	{ header: '年利率', key: 'rate', width: 11, numFmt: '0.0000%' },
	{ header: '当期新增本金', key: 'newPrincipal', width: 14, numFmt: '#,##0.00' },
	{ header: '还款金额', key: 'repayment', width: 13, numFmt: '#,##0.00' },
	{ header: '当期应还债务本金', key: 'principalAtStart', width: 17, numFmt: '#,##0.00' },
	{ header: '当期产生一般债务利息', key: 'interestAccrued', width: 20, numFmt: '#,##0.00' },
	{ header: '当期应还一般债务利息', key: 'interestShouldBePaid', width: 20, numFmt: '#,##0.00' },
	{ header: '当期实还一般债务利息', key: 'interestPaid', width: 20, numFmt: '#,##0.00' },
	{ header: '当期实还债务本金', key: 'principalPaid', width: 16, numFmt: '#,##0.00' },
	{ header: '当期剩余应还一般债务利息', key: 'interestRemaining', width: 22, numFmt: '#,##0.00' },
	{ header: '当期剩余应还债务本金', key: 'principalRemaining', width: 20, numFmt: '#,##0.00' },
	{ header: '备注', key: 'remark', width: 14, numFmt: '@' },
]

/** 计罚息时的列定义（18 列，加倍利息相关列插在还款金额之后） */
const PUNISH_COLUMNS = [
	{ header: '当期首日', key: 'startDate', width: 12.5, numFmt: '@' },
	{ header: '当期末日（还款日）', key: 'endDate', width: 18, numFmt: '@' },
	{ header: '计息天数', key: 'days', width: 10, numFmt: '0' },
	{ header: '年利率', key: 'rate', width: 11, numFmt: '0.0000%' },
	{ header: '加倍债务利息日利率', key: 'punishRate', width: 16, numFmt: '0.0000%' },
	{ header: '当期新增本金', key: 'newPrincipal', width: 14, numFmt: '#,##0.00' },
	{ header: '还款金额', key: 'repayment', width: 13, numFmt: '#,##0.00' },
	{ header: '当期产生加倍部分债务利息', key: 'punishAccrued', width: 22, numFmt: '#,##0.00' },
	{ header: '当期应还加倍部分债务利息', key: 'punishShouldBePaid', width: 22, numFmt: '#,##0.00' },
	{ header: '当期应还债务本金', key: 'principalAtStart', width: 17, numFmt: '#,##0.00' },
	{ header: '当期产生一般债务利息', key: 'interestAccrued', width: 20, numFmt: '#,##0.00' },
	{ header: '当期应还一般债务利息', key: 'interestShouldBePaid', width: 20, numFmt: '#,##0.00' },
	{ header: '当期实还一般债务利息', key: 'interestPaid', width: 20, numFmt: '#,##0.00' },
	{ header: '当期实还债务本金', key: 'principalPaid', width: 16, numFmt: '#,##0.00' },
	{ header: '当期实还加倍部分债务利息', key: 'punishPaid', width: 24, numFmt: '#,##0.00' },
	{ header: '当期剩余应还一般债务利息', key: 'interestRemaining', width: 22, numFmt: '#,##0.00' },
	{ header: '当期剩余应还债务本金', key: 'principalRemaining', width: 20, numFmt: '#,##0.00' },
	{ header: '当期剩余应还加倍部分债务利息', key: 'punishRemaining', width: 26, numFmt: '#,##0.00' },
]

const BORDER_COLOR = 'FFD8D8D8'
const BORDER = {
	top: { style: 'thin', color: { argb: BORDER_COLOR } },
	left: { style: 'thin', color: { argb: BORDER_COLOR } },
	bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
	right: { style: 'thin', color: { argb: BORDER_COLOR } },
}

/** 导出文件名：借贷利息计算_截止YYYYMMDD.xlsx */
export function buildFileName(endDate) {
	const compact = String(endDate || '').replace(/-/g, '') || 'result'
	return `借贷利息计算_${compact}.xlsx`
}

/**
 * 构造工作簿。
 * @param {object} options
 * @param {object} options.result  calculateInterest(...) 的返回值
 * @param {object} options.form    页面表单（用于案件信息区）
 * @param {object} [options.labels] 中文标签，如利率方式名称
 */
export async function buildWorkbook({ result, form, labels = {} }) {
	const withPunish = form.v_punish === '1'
	const columns = withPunish ? PUNISH_COLUMNS : BASE_COLUMNS
	const columnCount = columns.length

	const workbook = new ExcelJS.Workbook()
	workbook.creator = 'LawerLab'
	workbook.created = new Date()
	const sheet = workbook.addWorksheet('利息计算')
	sheet.columns = columns.map((column) => ({ header: column.header, key: column.key, width: column.width }))

	// ---------- 标题
	sheet.mergeCells(1, 1, 1, columnCount)
	const titleCell = sheet.getCell(1, 1)
	titleCell.value = '借贷利息计算明细表'
	titleCell.font = { bold: true, size: 14 }
	titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
	sheet.getRow(1).height = 28

	// ---------- 案件信息（两列一组横向排布）
	const info = [
		['计算截止日', form.end_date || '—'],
		['利率方式', labels.rateMode || '—'],
		['计息基数', form.r_value_1 === '2' ? '年 / 365 天' : '年 / 360 天'],
		['计罚息', withPunish ? '是（加倍部分债务利息）' : '否'],
	]
	if (withPunish) info.push(['加倍利息起算日', form.punish_start_date || '—'])
	info.push(['明细期数', String(result.rows.length)])
	info.push(['生成时间', new Date().toLocaleString('zh-CN')])

	let cursor = 2
	info.forEach(([label, value], index) => {
		const rowIndex = cursor + Math.floor(index / 2)
		const columnIndex = (index % 2) * 2 + 1
		const labelCell = sheet.getCell(rowIndex, columnIndex)
		labelCell.value = label
		labelCell.font = { bold: true, size: 10 }
		const valueCell = sheet.getCell(rowIndex, columnIndex + 1)
		valueCell.value = value
		valueCell.font = { size: 10 }
	})
	cursor += Math.ceil(info.length / 2) + 1

	// ---------- 汇总结果
	const summary = [
		['剩余债务本金（元）', Number(result.principal) || 0],
		['剩余应还一般债务利息（元）', Number(result.interest) || 0],
	]
	if (withPunish) {
		summary.push(['剩余应还加倍部分债务利息（元）', Number(result.punish) || 0])
	}
	summary.push([
		withPunish ? '应还本息及加倍利息合计（元）' : '应还本息合计（元）',
		Number(result.punishTotal) || 0,
	])

	summary.forEach(([label, value], index) => {
		const rowIndex = cursor + index
		const isTotal = index === summary.length - 1
		const labelCell = sheet.getCell(rowIndex, 1)
		labelCell.value = label
		labelCell.font = { bold: isTotal, size: 10 }
		const valueCell = sheet.getCell(rowIndex, 2)
		valueCell.value = value
		valueCell.numFmt = '#,##0.00'
		valueCell.font = { bold: isTotal, size: 10 }
	})
	cursor += summary.length + 1

	// ---------- 表头
	const headerRow = sheet.getRow(cursor)
	columns.forEach((column, index) => {
		const cell = headerRow.getCell(index + 1)
		cell.value = column.header
		cell.font = { bold: true, size: 10 }
		cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
		cell.border = BORDER
		cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
	})
	headerRow.height = 38
	cursor += 1

	// ---------- 逐期明细
	result.rows.forEach((row) => {
		const values = {
			startDate: row.startDate,
			endDate: row.endDate,
			days: Number(row.days) || 0,
			rate: Number(row.rate) || 0,
			punishRate: Number(row.punishRate) || 0,
			newPrincipal: Number(row.newPrincipal) || 0,
			repayment: Number(row.repayment) || 0,
			punishAccrued: Number(row.punishAccrued) || 0,
			punishShouldBePaid: Number(row.punishShouldBePaid) || 0,
			principalAtStart: Number(row.principalAtStart) || 0,
			interestAccrued: Number(row.interestAccrued) || 0,
			interestShouldBePaid: Number(row.interestShouldBePaid) || 0,
			interestPaid: Number(row.interestPaid) || 0,
			principalPaid: Number(row.principalPaid) || 0,
			punishPaid: Number(row.punishPaid) || 0,
			interestRemaining: Number(row.interestRemaining) || 0,
			principalRemaining: Number(row.principalRemaining) || 0,
			punishRemaining: Number(row.punishRemaining) || 0,
		}
		const dataRow = sheet.getRow(cursor)
		columns.forEach((column, index) => {
			const cell = dataRow.getCell(index + 1)
			cell.value = values[column.key] ?? ''
			if (column.numFmt) cell.numFmt = column.numFmt
			cell.border = BORDER
			cell.font = { size: 10 }
			cell.alignment = index < 2 ? { horizontal: 'left' } : { horizontal: 'right' }
		})
		cursor += 1
	})

	// ---------- 合计行（标签写在倒数第二列，合计值写在最后一列）
	const totalLabelCell = sheet.getCell(cursor, columnCount - 1)
	totalLabelCell.value = withPunish ? '应还本息及加倍利息合计' : '应还本息合计'
	totalLabelCell.font = { bold: true, size: 10 }
	totalLabelCell.alignment = { horizontal: 'right' }

	const totalValueCell = sheet.getCell(cursor, columnCount)
	totalValueCell.value = Number(result.punishTotal) || 0
	totalValueCell.numFmt = '#,##0.00'
	totalValueCell.font = { bold: true, size: 10 }
	totalValueCell.alignment = { horizontal: 'right' }

	// 合计行整行加底色，便于识别
	for (let column = 1; column <= columnCount; column += 1) {
		sheet.getCell(cursor, column).fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFF7F7F7' },
		}
	}
	sheet.getRow(cursor).height = 20

	return workbook
}

/** 生成二进制内容（Uint8Array） */
export async function buildWorkbookFile(options) {
	const workbook = await buildWorkbook(options)
	const buffer = await workbook.xlsx.writeBuffer()
	return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
}

/** 浏览器侧：生成并触发下载，返回文件名 */
export async function downloadWorkbook({ result, form, labels }) {
	const bytes = await buildWorkbookFile({ result, form, labels })
	const blob = new Blob([bytes], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	})
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	const fileName = buildFileName(form.end_date)
	link.download = fileName
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	setTimeout(() => URL.revokeObjectURL(url), 1000)
	return fileName
}
