import React from 'react'

import './footer.scss'

import { useContext } from '../../context'
import { locale } from '../../utils'
import HiddenFileInput from '../hiddenFileInput/hiddenFileInput'

const AppFooter = React.memo(function AppFooter() {
	const context = useContext()
	const fileInputRef = React.useRef()

	function openSettings() {
		context.dispatch({
			type: 'setModal',
			modal: 'settings',
		})
	}

	function openHelp() {
		context.dispatch({
			type: 'setModal',
			modal: 'help',
		})
	}

	function openRepository() {
		if (context.state.images.length) {
			context.dispatch({ type: 'setImages', images: [] })
			return
		}
		fileInputRef.current?.click()
	}

	return (
		<React.Fragment>
			<span className='link' onClick={openHelp}>
				{locale.footerHelp}
			</span>

			<span className='link' onClick={openSettings}>
				{locale.footerSettings}
			</span>

			<span className='link' onClick={openRepository}>
				{context.state.images.length ? locale.footerDesyncRepo : locale.footerOpenRepo}
			</span>

			<HiddenFileInput ref={fileInputRef} />
		</React.Fragment>
	)
})

export default AppFooter
