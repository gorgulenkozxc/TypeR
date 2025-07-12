import lodash from 'lodash'
import React from 'react'
import { AiOutlineBorderInner } from 'react-icons/ai'
import {
	FiArrowDown,
	FiArrowRightCircle,
	FiArrowUp,
	FiMinusCircle,
	FiPlusCircle,
} from 'react-icons/fi'
import { MdCenterFocusWeak } from 'react-icons/md'

import './previewBlock.scss'

import { useContext } from '../../context'
import {
	alignTextLayerToSelection,
	changeActiveLayerTextSize,
	createTextLayerInSelection,
	getStyleObject,
	locale,
	scrollToLine,
	setActiveLayerText,
} from '../../utils'

const PreviewBlock = React.memo(function PreviewBlock() {
	const context = useContext()
	const style = context.state.currentStyle || {}
	const line = context.state.currentLine || { text: '' }
	const textStyle = style.textProps?.layerText.textStyleRange[0].textStyle || {}
	const styleObject = getStyleObject(textStyle)

	function createLayer() {
		let lineStyle = context.state.currentStyle

		if (lineStyle && context.state.textScale) {
			lineStyle = lodash.cloneDeep(lineStyle)
			const txtStyle = lineStyle.textProps?.layerText.textStyleRange?.[0]?.textStyle || {}

			if (typeof txtStyle.size === 'number') {
				txtStyle.size *= context.state.textScale * 0.01
			}

			if (typeof txtStyle.leading === 'number' && txtStyle.leading) {
				txtStyle.leading *= context.state.textScale * 0.01
			}
		}

		const pointText = context.state.pastePointText
		createTextLayerInSelection(line.text, lineStyle, pointText, (ok) => {
			if (ok) {
				context.dispatch({ type: 'nextLine', add: true })
			}
		})
	}

	function insertStyledText() {
		let lineStyle = context.state.currentStyle

		if (lineStyle && context.state.textScale) {
			lineStyle = lodash.cloneDeep(lineStyle)
			const txtStyle = lineStyle.textProps?.layerText.textStyleRange?.[0]?.textStyle || {}

			if (typeof txtStyle.size === 'number') {
				txtStyle.size *= context.state.textScale * 0.01
			}

			if (typeof txtStyle.leading === 'number' && txtStyle.leading) {
				txtStyle.leading *= context.state.textScale * 0.01
			}
		}

		setActiveLayerText(line.text, lineStyle, (ok) => {
			if (ok) {
				context.dispatch({ type: 'nextLine', add: true })
			}
		})
	}

	function currentLineClick() {
		if (!line.rawIndex) {
			return
		}

		scrollToLine(line.rawIndex)
	}

	function setTextScale(scale) {
		context.dispatch({ type: 'setTextScale', scale })
	}

	function focusScale() {
		if (!context.state.textScale) {
			setTextScale(100)
		}
	}

	function blurScale() {
		if (context.state.textScale === 100) {
			setTextScale(null)
		}
	}

	return (
		<React.Fragment>
			<div className='preview-top'>
				<button
					className='preview-top_big-btn topcoat-button--large--cta'
					title={locale.createLayerDescr}
					onClick={createLayer}
					type='button'
				>
					<AiOutlineBorderInner size={18} /> {locale.createLayer}
				</button>

				<button
					className='preview-top_big-btn topcoat-button--large'
					onClick={() => alignTextLayerToSelection()}
					title={locale.alignLayerDescr}
					type='button'
				>
					<MdCenterFocusWeak size={18} /> {locale.alignLayer}
				</button>
				<div className='preview-top_change-size-cont'>
					<button
						onClick={() => changeActiveLayerTextSize(-1)}
						className='topcoat-icon-button--large'
						title={locale.layerTextSizeMinus}
						type='button'
					>
						<FiMinusCircle size={18} />
					</button>

					<button
						onClick={() => changeActiveLayerTextSize(1)}
						className='topcoat-icon-button--large'
						title={locale.layerTextSizePlus}
						type='button'
					>
						<FiPlusCircle size={18} />
					</button>
				</div>
			</div>

			<div className='preview-bottom'>
				<div className='preview-nav'>
					<button
						onClick={() => context.dispatch({ type: 'prevLine' })}
						className='topcoat-icon-button--large'
						title={locale.prevLine}
						type='button'
					>
						<FiArrowUp size={18} />
					</button>

					<button
						onClick={() => context.dispatch({ type: 'nextLine' })}
						className='topcoat-icon-button--large'
						title={locale.nextLine}
						type='button'
					>
						<FiArrowDown size={18} />
					</button>
				</div>

				<div
					className='preview-current hostBgdDark'
					title={locale.scrollToLine}
					onClick={currentLineClick}
				>
					<div className='preview-line-info'>
						<div className='preview-line-info-text'>
							{locale.previewLine}: <b>{line.index || '—'}</b>, {locale.previewStyle}:{' '}
							<b className='preview-line-style-name'>{style.name || '—'}</b>,{' '}
							{locale.previewTextScale}:
							<div className='preview-line-scale'>
								<input
									onChange={(e) => setTextScale(e.target.value)}
									value={context.state.textScale || ''}
									className='topcoat-text-input'
									onFocus={focusScale}
									onBlur={blurScale}
									placeholder='100'
									type='number'
									max={999}
									min={1}
								/>
								<span>%</span>
							</div>
						</div>

						<div className='preview-line-info-actions' title={locale.insertStyledText}>
							<FiArrowRightCircle size={16} onClick={insertStyledText} />
						</div>
					</div>

					<div
						className='preview-line-text'
						style={{
							fontFamily: 'Tahoma',
							...styleObject,
						}}
					>
						{line.text || ''}
					</div>
				</div>
			</div>
		</React.Fragment>
	)
})

export default PreviewBlock
