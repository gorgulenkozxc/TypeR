import PropTypes from 'prop-types'
import React from 'react'

import config from './config'
import {
	checkUpdate,
	locale,
	readStorage,
	scrollToLine,
	scrollToStyle,
	writeToStorage,
} from './utils'

const storage = readStorage()
const storeFields = [
	'ignoreLinePrefixes',
	'currentLineIndex',
	'autoScrollStyle',
	'pastePointText',
	'defaultStyleId',
	'currentStyleId',
	'notFirstTime',
	'checkUpdates',
	'autoClosePSD',
	'middleEast',
	'textScale',
	'direction',
	'shortcut',
	'language',
	'folders',
	'styles',
	'images',
	'theme',
	'text',
]

const defaultShortcut = {
	decrease: ['CTRL', 'SHIFT', 'MINUS'],
	increase: ['CTRL', 'SHIFT', 'PLUS'],
	previous: ['CTRL', 'TAB'],
	insertText: ['WIN', 'V'],
	next: ['CTRL', 'ENTER'],
	apply: ['WIN', 'SHIFT'],
	center: ['WIN', 'ALT'],
	add: ['WIN', 'CTRL'],
}

const initialState = {
	autoScrollStyle: storage.data?.autoScrollStyle !== false,
	checkUpdates: config.checkUpdates,
	ignoreLinePrefixes: ['##'],
	pastePointText: false,
	defaultStyleId: null,
	currentStyleId: null,
	notFirstTime: false,
	currentLineIndex: 0,
	autoClosePSD: false,
	currentStyle: null,
	middleEast: false,
	currentLine: null,
	theme: 'default',
	language: 'auto',
	initiated: false,
	direction: 'ltr',
	textScale: null,
	openFolders: [],
	modalType: null,
	modalData: {},
	folders: [],
	styles: [],
	images: [],
	lines: [],
	text: '',
	...storage.data,
	shortcut: { ...defaultShortcut, ...(storage.data?.shortcut || {}) },
}

function reducer(state, action) {
	let thenScroll = false
	let thenSelectStyle = false

	const newState = Object.assign({}, state)

	switch (action.type) {
		case 'removeFirstTime': {
			newState.notFirstTime = true
			newState.modalType = 'help'
			break
		}

		case 'import': {
			for (const field in action.data) {
				if (!Object.hasOwn(action.data, field)) {
					continue
				}

				if (!Object.hasOwn(initialState, field)) {
					continue
				}

				if (field === 'styles' && state.styles) {
					const styles = []
					let asked = false
					let keep = false

					for (const style of state.styles) {
						const inImport = action.data.styles.find((s) => s.id === style.id)
						if (
							!inImport ||
							(style.edited && !inImport.edited) ||
							(style.edited && inImport.edited && style.edited > inImport.edited)
						) {
							if (!asked) {
								keep = confirm(locale.settingsImportReplace)
								asked = true
							}

							if (keep) {
								styles.push(style)
							}
						}
					}

					for (const style of action.data.styles) {
						if (!keep) {
							styles.push(style)
							continue
						}

						const oldStyle = state.styles.find((s) => s.id === style.id)
						if (!oldStyle?.edited || (style.edited && style.edited >= oldStyle.edited)) {
							styles.push(style)
						}
					}

					newState[field] = styles
				} else {
					newState[field] = action.data[field]
				}
			}
			break
		}

		case 'setText': {
			newState.text = action.text
			break
		}

		case 'setCurrentLineIndex': {
			newState.currentLineIndex = action.index
			thenSelectStyle = true
			break
		}

		case 'prevLine': {
			if (!state.text) {
				break
			}

			for (let i = state.currentLineIndex - 1; i >= 0; i--) {
				if (!state.lines[i].ignore) {
					newState.currentLineIndex = state.lines[i].rawIndex
					break
				}
			}

			thenScroll = true
			thenSelectStyle = true
			break
		}

		case 'nextLine': {
			if (!state.text || (action.add && newState.currentLine.last)) {
				break
			}

			for (let i = state.currentLineIndex + 1; i < state.lines.length; i++) {
				if (!state.lines[i].ignore) {
					newState.currentLineIndex = state.lines[i].rawIndex
					break
				}
			}

			thenScroll = true
			thenSelectStyle = true
			break
		}

		case 'setCurrentStyleId': {
			newState.currentStyleId = action.id
			break
		}

		case 'setTextScale': {
			let scale = Number.parseInt(action.scale, 10) || null
			if (scale) {
				scale = Math.max(0, Math.min(scale, 999))
			}
			newState.textScale = scale
			break
		}

		case 'saveFolder': {
			const editId = action.id || action.data.id
			if (action.data.styleIds) {
				const styles = state.styles.concat([])
				const { styleIds } = action.data

				for (const style of styles) {
					if (style.folder !== editId) {
						continue
					}

					if (!styleIds.includes(style.id)) {
						style.folder = null
					}
				}

				for (const styleId of styleIds) {
					const style = styles.find((style) => style.id === styleId)
					if (style) {
						style.folder = editId
					}
				}

				newState.styles = styles
				delete action.data.styleIds
			}

			const folders = state.folders.concat([])
			const folder = folders.find((f) => f.id === editId)

			if (folder) {
				Object.assign(folder, action.data)
			} else {
				folders.push(action.data)
			}

			newState.folders = folders
			break
		}

		case 'deleteFolder': {
			newState.folders = state.folders.filter((f) => f.id !== action.id)
			break
		}
		case 'duplicateFolder': {
			const folderToDup = action.data
			const newFolderId = Math.random().toString(36).substr(2, 8)
			const newFolderName = `${folderToDup.name} copy`
			const newFolder = { id: newFolderId, name: newFolderName }

			newState.folders = state.folders.concat(newFolder)

			const stylesCopy = state.styles.filter((s) => s.folder === folderToDup.id)
			const newStyles = stylesCopy.map((s) => {
				const newStyleId = Math.random().toString(36).substr(2, 8)
				return { ...s, id: newStyleId, folder: newFolderId }
			})

			newState.styles = state.styles.concat(newStyles)
			newState.openFolders = state.openFolders.concat(newFolderId)
			break
		}

		case 'toggleFolder': {
			let open = state.openFolders.concat([])
			const id = action.id || 'unsorted'

			if (open.includes(id)) {
				open = open.filter((f) => f !== id)
			} else {
				open.push(id)
			}

			newState.openFolders = open
			break
		}

		case 'setFolders': {
			newState.folders = action.data || []
			break
		}

		case 'saveStyle': {
			if (typeof action.data.prefixes === 'string') {
				const arr = action.data.prefixes.split(/(?:\r?\n|;)/)
				action.data.prefixes = arr.map((p) => p.trim()).filter(Boolean)
			} else if (!Array.isArray(action.data.prefixes)) {
				action.data.prefixes = []
			}

			const styles = state.styles.concat([])
			const editId = action.id || action.data.id
			const style = styles.find((s) => s.id === editId)

			if (style) {
				Object.assign(style, action.data)
			} else {
				styles.push(action.data)
			}

			newState.styles = styles
			break
		}

		case 'deleteStyle': {
			newState.styles = state.styles.filter((s) => s.id !== action.id)
			break
		}

		case 'duplicateStyle': {
			const styleToDup = action.data || state.styles.find((s) => s.id === state.currentStyleId)
			if (styleToDup) {
				const newStyleId = Math.random().toString(36).substr(2, 8)
				const newStyle = { ...styleToDup, id: newStyleId, name: `${styleToDup.name} copy` }
				newState.styles = state.styles.concat(newStyle)
				newState.currentStyleId = newStyleId
			}
			break
		}

		case 'setStyles': {
			newState.styles = action.data || []
			break
		}

		case 'setIgnoreLinePrefixes': {
			if (!action.data) {
				newState.ignoreLinePrefixes = []
			} else if (Array.isArray(action.data)) {
				newState.ignoreLinePrefixes = action.data
			} else if (typeof action.data === 'string') {
				const arr = action.data.split(/(?:\r?\n|;)/)
				newState.ignoreLinePrefixes = arr.map((p) => p.trim()).filter(Boolean)
			}
			break
		}

		case 'setDefaultStyleId': {
			newState.defaultStyleId = action.id || null
			break
		}

		case 'setPastePointText': {
			newState.pastePointText = !!action.isPoint
			break
		}

		case 'setAutoClosePSD': {
			newState.autoClosePSD = !!action.value
			break
		}

		case 'setCheckUpdates': {
			newState.checkUpdates = !!action.value
			break
		}

		case 'setAutoScrollStyle': {
			newState.autoScrollStyle = !!action.value
			break
		}

		case 'setLanguage': {
			newState.language = action.lang || 'auto'
			break
		}

		case 'setTheme': {
			newState.theme = action.theme || 'default'
			break
		}

		case 'setDirection': {
			newState.direction = action.direction || 'ltr'
			break
		}

		case 'setMiddleEast': {
			newState.middleEast = !!action.value
			break
		}

		case 'setModal': {
			newState.modalType = action.modal || null
			newState.modalData = action.data || {}
			break
		}

		case 'setImages': {
			newState.images = action.images
			break
		}

		case 'updateShortcut': {
			newState.shortcut = action.shortcut
			break
		}
	}

	for (const style of newState.styles) {
		const folderId = style.folder || null
		const hasFolder = newState.folders.find((f) => f.id === folderId)
		if (!hasFolder) {
			style.folder = null
		}
	}

	if (newState.defaultStyleId) {
		const hasDefault = newState.styles.find((s) => s.id === newState.defaultStyleId)
		if (!hasDefault) {
			newState.defaultStyleId = null
		}
	}

	let sortedStyles = newState.styles.filter((s) => !s.folder)

	for (const folder of newState.folders) {
		const folderStyles = newState.styles.filter((s) => s.folder === folder.id)
		sortedStyles = sortedStyles.concat(folderStyles)
	}

	newState.styles = sortedStyles

	const stylePrefixes = []
	const folderPrefixes = []
	const currentFolder = state.currentStyle ? state.currentStyle.folder || null : null

	for (const style of newState.styles) {
		const folder = style.folder || null

		for (const prefix of style.prefixes) {
			const data = { prefix, style, folder }
			stylePrefixes.push(data)

			if (folder === currentFolder) {
				folderPrefixes.push(data)
			}
		}
	}

	let linesCounter = 0
	const rawLines = newState.text ? newState.text.split('\n') : []
	const lastIndexesList = []
	let previousStyle = null

	newState.lines = rawLines.map((rawText, rawIndex) => {
		const ignorePrefix = newState.ignoreLinePrefixes.find((pr) => rawText.startsWith(pr)) || ''
		const hasStylePrefix =
			folderPrefixes.find((sp) => rawText.startsWith(sp.prefix)) ||
			stylePrefixes.find((sp) => rawText.startsWith(sp.prefix))

		let stylePrefix = ''
		let style = null

		if (rawText.startsWith('//')) {
			stylePrefix = rawText.startsWith('//:') ? '//:' : '//'
			style = previousStyle
		} else if (hasStylePrefix) {
			stylePrefix = hasStylePrefix.prefix
			style = hasStylePrefix.style
		}

		const text = rawText.replace(ignorePrefix, '').replace(stylePrefix, '').trim()
		const isPage = rawText.match(/Page [0-9]+/)
		const ignore = !!ignorePrefix || !text || isPage
		if (isPage && newState.images.length) {
			lastIndexesList.push(linesCounter)
		}
		const index = ignore ? 0 : ++linesCounter
		const line = { rawText, rawIndex, ignorePrefix, stylePrefix, style, ignore, index, text }
		if (!line.ignore && line.style) {
			previousStyle = line.style
		}
		return line
	})

	for (const index of lastIndexesList) {
		newState.lines.find((line) => line.index === index).last = true
	}

	newState.currentLine = newState.lines[newState.currentLineIndex] || null

	if (!newState.currentLine || newState.currentLine.ignore) {
		let newIndex = 0
		for (const line of newState.lines) {
			if (!line.ignore) {
				newIndex = line.rawIndex
				break
			}
		}
		newState.currentLine = newState.lines[newIndex] || null
		newState.currentLineIndex = newIndex
	}

	if (thenSelectStyle) {
		if (newState.currentLine.style) {
			newState.currentStyleId = newState.currentLine.style.id
		} else if (newState.defaultStyleId) {
			newState.currentStyleId = newState.defaultStyleId
		}
	}

	newState.currentStyle = newState.styles.find((s) => s.id === newState.currentStyleId)
	if (!newState.currentStyle) {
		const newId = newState.styles.length ? newState.styles[0].id : null
		newState.currentStyle = newId ? newState.styles[0] : null
		newState.currentStyleId = newId
	}

	if (!newState.initiated) {
		if (newState.currentStyle?.folder) {
			newState.openFolders = [newState.currentStyle.folder]
		} else {
			newState.openFolders = ['unsorted']
		}
	}
	if (newState.currentStyle && newState.currentStyleId !== state.currentStyleId) {
		const folder = newState.currentStyle.folder || 'unsorted'

		if (!newState.openFolders.includes(folder)) {
			newState.openFolders.push(folder)
		}

		if (newState.autoScrollStyle) {
			scrollToStyle(newState.currentStyleId)
		}
	}

	if (thenScroll) {
		scrollToLine(newState.currentLineIndex)
	}

	const dataToStore = {}
	for (const field in newState) {
		if (!Object.hasOwn(newState, field)) {
			continue
		}

		if (storeFields.includes(field)) {
			dataToStore[field] = newState[field]
		}
	}

	newState.initiated = true
	writeToStorage(dataToStore)

	return newState
}

const Context = React.createContext()
const useContext = () => React.useContext(Context)
const ContextProvider = React.memo(function ContextProvider(props) {
	const [state, dispatch] = React.useReducer(reducer, initialState)
	React.useEffect(() => dispatch({}), [])

	const defaultStyleRef = React.useRef('')
	React.useEffect(() => {
		const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
		const indexLink = links.find((l) => !l.id && l.getAttribute('href'))
		if (indexLink) {
			defaultStyleRef.current = indexLink.getAttribute('href')
			indexLink.remove()
		}
	}, [])

	React.useEffect(() => {
		if (state.checkUpdates) {
			checkUpdate(config.appVersion).then((data) => {
				if (data) {
					dispatch({ type: 'setModal', modal: 'update', data })
				}
			})
		}
	}, [state.checkUpdates])

	React.useEffect(() => {
		const link = document.getElementById('themeStyle')
		if (!link) {
			return
		}
		if (state.theme && state.theme !== 'default') {
			link.setAttribute('href', `./themes/${state.theme}.css`)
		} else {
			link.setAttribute('href', defaultStyleRef.current || './index.css')
		}
	}, [state.theme])

	return <Context.Provider value={{ state, dispatch }}>{props.children}</Context.Provider>
})
ContextProvider.propTypes = {
	children: PropTypes.any.isRequired,
}

export { useContext, ContextProvider }
