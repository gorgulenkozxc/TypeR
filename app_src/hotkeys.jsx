import _ from 'lodash'
import React from 'react'

import { useContext } from './context'
import {
	alignTextLayerToSelection,
	changeActiveLayerTextSize,
	createTextLayerInSelection,
	csInterface,
	getHotkeyPressed,
	setActiveLayerText,
} from './utils'

const INTERVAL_TIME = 50
let keyboardInterval = 0
let keyUp = true
let lastActionTimestamp = 0

function checkRepeatTime(time = 0) {
	const now = Date.now()

	if (!keyUp || now - lastActionTimestamp < time) {
		return false
	}

	lastActionTimestamp = now
	keyUp = false

	return true
}

function checkShortcut(state, ref) {
	return ref.every((key) => state.includes(key))
}

const HotkeysListner = React.memo(function HotkeysListner() {
	const context = useContext()
	const checkState = (state) => {
		const realState = state.split('a')

		// crazy shit...
		realState.shift()
		realState.pop()

		if (checkShortcut(realState, context.state.shortcut.add)) {
			if (!checkRepeatTime()) {
				return
			}

			const line = context.state.currentLine || { text: '' }
			let style = context.state.currentStyle

			if (style && context.state.textScale) {
				style = _.cloneDeep(style)
				const txtStyle = style.textProps?.layerText.textStyleRange?.[0]?.textStyle || {}

				if (typeof txtStyle.size === 'number') {
					txtStyle.size *= context.state.textScale / 100
				}

				if (typeof txtStyle.leading === 'number' && txtStyle.leading) {
					txtStyle.leading *= context.state.textScale / 100
				}
			}

			const pointText = context.state.pastePointText
			createTextLayerInSelection(line.text, style, pointText, (ok) => {
				if (ok) {
					context.dispatch({ type: 'nextLine', add: true })
				}
			})

			return
		}

		if (checkShortcut(realState, context.state.shortcut.apply)) {
			if (!checkRepeatTime()) {
				return
			}

			const line = context.state.currentLine || { text: '' }
			let style = context.state.currentStyle

			if (style && context.state.textScale) {
				style = _.cloneDeep(style)
				const txtStyle = style.textProps?.layerText.textStyleRange?.[0]?.textStyle || {}

				if (typeof txtStyle.size === 'number') {
					txtStyle.size *= context.state.textScale / 100
				}

				if (typeof txtStyle.leading === 'number' && txtStyle.leading) {
					txtStyle.leading *= context.state.textScale / 100
				}
			}

			setActiveLayerText(line.text, style, (ok) => {
				if (ok) {
					context.dispatch({ type: 'nextLine', add: true })
				}
			})
			return
		}

		if (checkShortcut(realState, context.state.shortcut.center)) {
			if (!checkRepeatTime()) {
				return
			}

			alignTextLayerToSelection()
			return
		}

		if (checkShortcut(realState, context.state.shortcut.next)) {
			if (!checkRepeatTime(300)) {
				return
			}

			context.dispatch({ type: 'nextLine' })
			return
		}

		if (checkShortcut(realState, context.state.shortcut.previous)) {
			if (!checkRepeatTime(300)) {
				return
			}

			context.dispatch({ type: 'prevLine' })
			return
		}

		if (checkShortcut(realState, context.state.shortcut.increase)) {
			if (!checkRepeatTime(300)) {
				return
			}

			changeActiveLayerTextSize(1)
			return
		}

		if (checkShortcut(realState, context.state.shortcut.decrease)) {
			if (!checkRepeatTime(300)) {
				return
			}

			changeActiveLayerTextSize(-1)
			return
		}

		if (checkShortcut(realState, context.state.shortcut.insertText)) {
			if (!checkRepeatTime()) {
				return
			}

			const line = context.state.currentLine || { text: '' }
			setActiveLayerText(line.text, null, (ok) => {
				if (ok) {
					context.dispatch({ type: 'nextLine', add: true })
				}
			})
			return
		}

		keyUp = true
	}

	clearInterval(keyboardInterval)
	keyboardInterval = setInterval(() => {
		if (context.state.modalType === 'settings') {
			return
		}

		getHotkeyPressed(checkState)
	}, INTERVAL_TIME)

	document.onkeydown = (e) => {
		if (e.key === 'Escape') {
			if (context.state.modalType) {
				context.dispatch({ type: 'setModal' })
			}
		}
	}

	React.useEffect(() => {
		const keyInterests = [{ keyCode: 27 }]
		csInterface.registerKeyEventsInterest(JSON.stringify(keyInterests))
	}, [])

	return <React.Fragment />
})

export default HotkeysListner
