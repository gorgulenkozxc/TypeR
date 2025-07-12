import './lib/CSInterface.js'

const csInterface = new window.CSInterface()
const SYSTEM_PATH = csInterface.getSystemPath(window.SystemPath.EXTENSION)
const STORAGE_PATH = `${SYSTEM_PATH}/storage`

let locale = {}
initLocale()

class Version {
	constructor(rawVersion) {
		if (typeof rawVersion === 'string') {
			const parts = [...rawVersion.matchAll(/\d+/g)]

			this.major = Number.parseInt(parts[0], 10)
			this.minor = Number.parseInt(parts[1], 10)
			this.patch = parts.length > 2 ? Number.parseInt(parts[2], 10) : 0
		} else if (rawVersion instanceof Version) {
			this.major = rawVersion.major
			this.minor = rawVersion.minor
			this.patch = rawVersion.patch
		} else {
			this.major = 0
			this.minor = 0
			this.patch = 0
		}
	}

	equals(version) {
		return (
			this.major === version.major && this.minor === version.minor && this.patch === version.patch
		)
	}
}

async function checkUpdate(currentVersionStr) {
	try {
		const response = await fetch(
			'https://api.github.com/repos/gorgulenkozxc/TypeR/releases/latest',
			{
				headers: { Accept: 'application/vnd.github.v3.html+json' },
			}
		)

		if (!response.ok) {
			return null
		}

		const data = await response.json()

		const newestVersion = new Version(data.tag_name)
		const currentVersion = new Version(currentVersionStr)

		if (data.tag_name && !currentVersion.equals(newestVersion)) {
			return { version: data.tag_name, body: data.body_html || data.body }
		}
	} catch (e) {
		console.error('Update check failed', e)
	}

	return null
}

function readStorage(key) {
	const result = window.cep.fs.readFile(STORAGE_PATH)

	if (result.err) {
		return key
			? () => {}
			: {
					error: result.err,
					data: {},
			  }
	}

	const data = JSON.parse(result.data || '{}') || {}
	return key ? data[key] : { data }
}

function writeToStorage(data, rewrite) {
	const storage = readStorage()
	if (storage.error || rewrite) {
		const result = window.cep.fs.writeFile(STORAGE_PATH, JSON.stringify(data))
		return !result.err
	}

	const mergedData = Object.assign({}, storage.data, data)
	const result = window.cep.fs.writeFile(STORAGE_PATH, JSON.stringify(mergedData))
	return !result.err
}

const parseLocaleFile = (fileContent) => {
	if (!fileContent) {
		return {}
	}

	const result = {}

	let key = null
	let val = ''

	const lines = fileContent.replace(/\r/g, '').split('\n')
	for (const line of lines) {
		if (line.startsWith('#')) {
			continue
		}

		if (key) {
			val += line

			if (val.endsWith('\\')) {
				val = `${val.slice(0, -1)}\n`
				continue
			}

			result[key] = val
			key = null
			val = ''
			continue
		}

		const positionOfEqualSign = line.indexOf('=')
		if (positionOfEqualSign === -1) {
			continue
		}

		key = line.slice(0, positionOfEqualSign).trim()
		val = line.slice(positionOfEqualSign + 1)

		if (val.endsWith('\\')) {
			val = `${val.slice(0, -1)}\n`
			continue
		}

		result[key] = val
		key = null
		val = ''
	}
	return result
}

function initLocale() {
	locale = csInterface.initResourceBundle()

	const lang = readStorage('language')

	if (!lang || lang === 'auto') {
		return
	}

	const filePath =
		lang === 'en_US'
			? `${SYSTEM_PATH}/locale/messages.properties`
			: `${SYSTEM_PATH}/locale/${lang}/messages.properties`

	const fileContent = window.cep.fs.readFile(filePath)

	if (!fileContent.err) {
		const data = parseLocaleFile(fileContent.data)

		locale = Object.assign(locale, data)
	}
}

function nativeAlert(text, title, isError) {
	const data = JSON.stringify({ text, title, isError })

	csInterface.evalScript(`nativeAlert(${data})`)
}

function nativeConfirm(text, title, callback) {
	const data = JSON.stringify({ text, title })

	csInterface.evalScript(`nativeConfirm(${data})`, (result) => callback(!!result))
}

let userFonts = null

function getUserFonts() {
	return Array.isArray(userFonts) ? userFonts.concat() : []
}

if (!userFonts) {
	csInterface.evalScript('getUserFonts()', (data) => {
		const dataObj = JSON.parse(data || '{}')
		const fonts = dataObj.fonts || []
		userFonts = fonts
	})
}

function getActiveLayerText(callback) {
	csInterface.evalScript('getActiveLayerText()', (data) => {
		const dataObj = JSON.parse(data || '{}')

		if (!(data && dataObj.textProps)) {
			nativeAlert(locale.errorNoTextLayer, locale.errorTitle, true)
			return
		}

		callback(dataObj)
	})
}

function setActiveLayerText(text, style, callback = () => {}) {
	if (!(text || style)) {
		nativeAlert(locale.errorNoTextNoStyle, locale.errorTitle, true)
		callback(false)
		return false
	}

	const data = JSON.stringify({ text, style })

	csInterface.evalScript(`setActiveLayerText(${data})`, (error) => {
		if (error) {
			nativeAlert(locale.errorNoTextLayer, locale.errorTitle, true)
		}

		callback(!error)
	})
}

function createTextLayerInSelection(text, _style, pointText, callback = () => {}) {
	if (!text) {
		nativeAlert(locale.errorNoText, locale.errorTitle, true)
		callback(false)
		return false
	}

	const style = _style || { textProps: getDefaultStyle(), stroke: getDefaultStroke() }

	const data = JSON.stringify({ text, style })

	csInterface.evalScript(`createTextLayerInSelection(${data}, ${!!pointText})`, (error) => {
		if (error === 'smallSelection') {
			nativeAlert(locale.errorSmallSelection, locale.errorTitle, true)
			return
		}

		if (error) {
			nativeAlert(locale.errorNoSelection, locale.errorTitle, true)
			return
		}

		callback(!error)
	})
}

function alignTextLayerToSelection() {
	csInterface.evalScript('alignTextLayerToSelection()', (error) => {
		if (error === 'smallSelection') {
			nativeAlert(locale.errorSmallSelection, locale.errorTitle, true)
			return
		}

		if (error === 'noSelection') {
			nativeAlert(locale.errorNoSelection, locale.errorTitle, true)
			return
		}

		if (error) {
			nativeAlert(locale.errorNoTextLayer, locale.errorTitle, true)
		}
	})
}

function changeActiveLayerTextSize(val, callback = () => {}) {
	csInterface.evalScript(`changeActiveLayerTextSize(${val})`, (error) => {
		if (error) {
			nativeAlert(locale.errorNoTextLayer, locale.errorTitle, true)
		}

		callback(!error)
	})
}

function getHotkeyPressed(callback) {
	csInterface.evalScript('getHotkeyPressed()', callback)
}

function resizeTextArea() {
	const textArea = document.querySelector('.text-area')
	const textLines = document.querySelector('.text-lines')

	if (textArea && textLines) {
		textArea.style.height = `${textLines.offsetHeight}px`
	}
}

function scrollToLine(lineIndex, delay = 300) {
	const targetIndex = lineIndex < 5 ? 0 : lineIndex - 5

	setTimeout(() => {
		const line = document.querySelectorAll('.text-line')[targetIndex]

		if (line) {
			line.scrollIntoView()
		}
	}, delay)
}

function scrollToStyle(styleId, delay = 100) {
	setTimeout(() => {
		const style = document.getElementById(styleId)

		if (style) {
			style.scrollIntoView()
		}
	}, delay)
}

function rgbToHex(rgb = {}) {
	const componentToHex = (c = 0) => `0${Math.round(c).toString(16)}`.substr(-2).toUpperCase()

	const r = rgb.red != null ? rgb.red : rgb.r
	const g = rgb.green != null ? rgb.green : rgb.g
	const b = rgb.blue != null ? rgb.blue : rgb.b

	return `#${componentToHex(r || 0)}${componentToHex(g || 0)}${componentToHex(b || 0)}`
}

function getStyleObject(textStyle) {
	const styleObj = {}

	if (textStyle.fontName) {
		styleObj.fontFamily = textStyle.fontName
	}

	if (textStyle.fontPostScriptName) {
		styleObj.fontFileFamily = textStyle.fontPostScriptName
	}

	if (textStyle.syntheticBold) {
		styleObj.fontWeight = 'bold'
	}

	if (textStyle.syntheticItalic) {
		styleObj.fontStyle = 'italic'
	}

	if (textStyle.fontCaps === 'allCaps') {
		styleObj.textTransform = 'uppercase'
	}

	if (textStyle.fontCaps === 'smallCaps') {
		styleObj.textTransform = 'lowercase'
	}

	if (textStyle.underline && textStyle.underline !== 'underlineOff') {
		styleObj.textDecoration = 'underline'
	}

	if (textStyle.strikethrough && textStyle.strikethrough !== 'strikethroughOff') {
		if (styleObj.textDecoration) {
			styleObj.textDecoration += ' line-through'
		} else {
			styleObj.textDecoration = 'line-through'
		}
	}

	return styleObj
}

function getDefaultStyle() {
	return {
		layerText: {
			antiAlias: 'antiAliasSmooth',
			orientation: 'horizontal',
			textGridding: 'none',
			textStyleRange: [
				{
					to: 100,
					from: 0,
					textStyle: {
						color: { red: 0, green: 0, blue: 0 },
						baselineDirection: 'withStream',
						fontPostScriptName: 'Tahoma',
						markYDistFromBaseline: 100,
						contextualLigatures: false,
						digitSet: 'defaultDigits',
						fontStyleName: 'Regular',
						impliedBaselineShift: 0,
						autoKern: 'metricsKern',
						connectionForms: false,
						otbaseline: 'normal',
						horizontalScale: 100,
						impliedFontSize: 14,
						fontAvailable: true,
						verticalScale: 100,
						fontName: 'Tahoma',
						fontCaps: 'normal',
						altligature: false,
						fontTechnology: 1,
						autoLeading: true,
						baselineShift: 0,
						ligature: false,
						diacXOffset: 0,
						fontScript: 0,
						tracking: 0,
						size: 14,
					},
				},
			],
			paragraphStyleRange: [
				{
					to: 100,
					from: 0,
					paragraphStyle: {
						justificationMethodType: 'justifMethodAutomatic',
						singleWordJustification: 'justifyAll',
						textEveryLineComposer: false,
						burasagari: 'burasagariNone',
						alignment: 'center',
						hangingRoman: true,
						hyphenate: true,
					},
				},
			],
		},
		typeUnit: 'pixelsUnit',
	}
}

function getDefaultStroke() {
	return {
		color: { r: 255, g: 255, b: 255 },
		position: 'outer',
		enabled: false,
		opacity: 100,
		size: 0,
	}
}

function openFile(path, autoClose = false) {
	const encodedPath = JSON.stringify(path)
	csInterface.evalScript(`openFile(${encodedPath}, ${!!autoClose})`)
}

const openUrl = window.cep.util.openURLInDefaultBrowser
export {
	createTextLayerInSelection,
	changeActiveLayerTextSize,
	alignTextLayerToSelection,
	setActiveLayerText,
	getActiveLayerText,
	getHotkeyPressed,
	getDefaultStroke,
	getDefaultStyle,
	writeToStorage,
	resizeTextArea,
	getStyleObject,
	scrollToStyle,
	nativeConfirm,
	scrollToLine,
	getUserFonts,
	readStorage,
	nativeAlert,
	csInterface,
	checkUpdate,
	rgbToHex,
	openFile,
	openUrl,
	locale,
}
