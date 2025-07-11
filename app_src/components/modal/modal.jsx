import React from 'react'

import './modal.scss'

import { useContext } from '../../context'
import EditFolderModal from './editFolder'
import EditStyleModal from './editStyle'
import ExportModal from './export'
import HelpModal from './help'
import SettingsModal from './settings'
import UpdateModal from './update'

const Modal = React.memo(function Modal() {
	const context = useContext()

	let modalContent = null
	const modalType = context.state.modalType
	if (modalType === 'help') {
		modalContent = <HelpModal />
	}
	if (modalType === 'settings') {
		modalContent = <SettingsModal />
	}
	if (modalType === 'editStyle') {
		modalContent = <EditStyleModal />
	}
	if (modalType === 'editFolder') {
		modalContent = <EditFolderModal />
	}
	if (modalType === 'export') {
		modalContent = <ExportModal />
	}
	if (modalType === 'update') {
		modalContent = <UpdateModal />
	}

	React.useEffect(() => {
		if (!context.state.notFirstTime) {
			context.dispatch({ type: 'removeFirstTime' })
		}
	}, [context.dispatch, context.state.notFirstTime])

	return modalContent ? (
		<div className='app-modal'>
			<div className='app-modal-hatch hostBgd' />
			<div className='app-modal-inner hostBgdLight'>{modalContent}</div>
		</div>
	) : null
})

export default Modal
