import React from 'react'

import './main.scss'

import { readStorage, resizeTextArea, writeToStorage } from '../../utils'
import AppFooter from '../footer/footer'
import Modal from '../modal/modal'
import PreviewBlock from '../previewBlock/previewBlock'
import StylesBlock from '../stylesBlock/stylesBlock'
import TextBlock from '../textBlock/textBlock'

const topHeight = 130
const minMiddleHeight = 100
const minBottomHeight = 70

const ResizeableCont = React.memo(function ResizeableCont() {
	const appBlock = React.useRef()
	const bottomBlock = React.useRef()

	let dragging = false
	let resizeStartY = 0
	let resizeStartH = 0
	let bottomHeight = 0
	let appHeight = 0

	function startBottomResize(e) {
		resizeStartH = bottomBlock.current.offsetHeight
		resizeStartY = e.pageY
		dragging = true
	}

	function stopBottomResize() {
		if (dragging) {
			writeToStorage({ bottomHeight })
			dragging = false
		}
	}

	function moveBottomResize(e) {
		if (dragging) {
			e.preventDefault()
			const dy = e.pageY - resizeStartY
			const newHeight = resizeStartH - dy
			setBottomSize(newHeight)
		}
	}

	const setBottomSize = React.useCallback(
		(height) => {
			const maxBottomHeight = appHeight - (appHeight > 450 ? topHeight : 0) - minMiddleHeight
			bottomHeight = height || readStorage('bottomHeight') || minBottomHeight
			if (height < minBottomHeight) {
				bottomHeight = minBottomHeight
			}
			if (height > maxBottomHeight) {
				bottomHeight = maxBottomHeight
			}
			bottomBlock.current.style.height = `${bottomHeight}px`
			resizeTextArea()
		},
		[appHeight, bottomHeight]
	)

	const setAppSize = React.useCallback(() => {
		appHeight = document.documentElement.clientHeight
		appBlock.current.style.height = `${appHeight}px`
		setBottomSize()
	}, [appHeight, setBottomSize])

	React.useEffect(() => {
		window.addEventListener('resize', setAppSize)
		setAppSize()
	}, [setAppSize])

	return (
		<div
			onMouseLeave={stopBottomResize}
			onMouseMove={moveBottomResize}
			onMouseUp={stopBottomResize}
			className='app-body'
			ref={appBlock}
		>
			<Modal />

			<div className='top-block preview-block' style={{ height: topHeight }}>
				<PreviewBlock />
			</div>

			<div className='top-divider hostBgdDark' />

			<div className='middle-block text-block'>
				<TextBlock />
			</div>

			<div className='middle-divider hostBgdDark' onMouseDown={startBottomResize}>
				<div className='hostBgdLight' />
			</div>

			<div className='bottom-block styles-block' ref={bottomBlock}>
				<StylesBlock />
			</div>

			<div className='footer-block hostBrdTopContrast'>
				<AppFooter />
			</div>
		</div>
	)
})

export default ResizeableCont
