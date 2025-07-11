import React from 'react'
import { FaFileExport, FaFileImport } from 'react-icons/fa'
import { FiX } from 'react-icons/fi'
import { MdSave } from 'react-icons/md'

import config from '../../config'
import { useContext } from '../../context'
import { checkUpdate, locale, nativeAlert } from '../../utils'
import Shortcut from './shortCut'

const SettingsModal = React.memo(function SettingsModal() {
	const context = useContext()
	const [pastePointText, setPastePointText] = React.useState(
		context.state.pastePointText ? '1' : ''
	)
	const [ignoreLinePrefixes, setIgnoreLinePrefixes] = React.useState(
		context.state.ignoreLinePrefixes.join('\n')
	)
	const [defaultStyleId, setDefaultStyleId] = React.useState(context.state.defaultStyleId || '')
	const [language, setLanguage] = React.useState(context.state.language || 'auto')
	const [theme, setTheme] = React.useState(context.state.theme || 'default')
	const [direction, setDirection] = React.useState(context.state.direction || 'ltr')
	const [middleEast, setMiddleEast] = React.useState(!!context.state.middleEast)
	const [autoClosePSD, setAutoClosePSD] = React.useState(!!context.state.autoClosePSD)
	const [autoScrollStyle, setAutoScrollStyle] = React.useState(
		context.state.autoScrollStyle !== false
	)
	const [checkUpdates, setCheckUpdates] = React.useState(context.state.checkUpdates !== false)
	const [edited, setEdited] = React.useState(false)

	const close = () => {
		context.dispatch({ type: 'setModal' })
	}

	const changePastePointText = (e) => {
		setPastePointText(e.target.value)
		setEdited(true)
	}

	const changeLinePrefixes = (e) => {
		setIgnoreLinePrefixes(e.target.value)
		setEdited(true)
	}

	const changeDefaultStyle = (e) => {
		setDefaultStyleId(e.target.value)
		setEdited(true)
	}

	const changeLanguage = (e) => {
		setLanguage(e.target.value)
		setEdited(true)
	}

	const changeTheme = (e) => {
		setTheme(e.target.value)
		setEdited(true)
	}

	const changeDirection = (e) => {
		setDirection(e.target.value)
		setEdited(true)
	}

	const changeMiddleEast = (e) => {
		const val = e.target.checked
		setMiddleEast(val)
		context.dispatch({ type: 'setMiddleEast', value: val })
		setEdited(true)
	}

	const changeAutoClosePSD = (e) => {
		setAutoClosePSD(e.target.checked)
		setEdited(true)
	}
	const changeAutoScrollStyle = (e) => {
		setAutoScrollStyle(e.target.checked)
		setEdited(true)
	}

	const changeCheckUpdates = (e) => {
		setCheckUpdates(e.target.checked)
		setEdited(true)
	}

	const save = (e) => {
		e.preventDefault()
		if (pastePointText !== context.state.pastePointText) {
			context.dispatch({
				type: 'setPastePointText',
				isPoint: !!pastePointText,
			})
		}
		if (ignoreLinePrefixes !== context.state.ignoreLinePrefixes.join('\n')) {
			context.dispatch({
				type: 'setIgnoreLinePrefixes',
				data: ignoreLinePrefixes,
			})
		}
		if (defaultStyleId !== context.state.defaultStyleId) {
			context.dispatch({
				type: 'setDefaultStyleId',
				id: defaultStyleId,
			})
		}
		if (language !== context.state.language) {
			context.dispatch({
				type: 'setLanguage',
				lang: language,
			})
			setTimeout(() => window.location.reload(), 100)
		}
		if (theme !== context.state.theme) {
			context.dispatch({
				type: 'setTheme',
				theme,
			})
		}
		if (direction !== context.state.direction) {
			context.dispatch({
				type: 'setDirection',
				direction,
			})
		}
		if (middleEast !== context.state.middleEast) {
			context.dispatch({
				type: 'setMiddleEast',
				value: middleEast,
			})
		}
		if (autoClosePSD !== context.state.autoClosePSD) {
			context.dispatch({
				type: 'setAutoClosePSD',
				value: autoClosePSD,
			})
		}

		if (autoScrollStyle !== context.state.autoScrollStyle) {
			context.dispatch({
				type: 'setAutoScrollStyle',
				value: autoScrollStyle,
			})
		}
		if (checkUpdates !== context.state.checkUpdates) {
			context.dispatch({
				type: 'setCheckUpdates',
				value: checkUpdates,
			})
		}
		const shortcut = {}

		for (const input of document.querySelectorAll('input[id^=shortcut_]')) {
			const typeShorcut = input.id.split('_').pop()
			shortcut[typeShorcut] = input.value.split(' + ')
		}

		context.dispatch({
			type: 'updateShortcut',
			shortcut: shortcut,
		})

		context.dispatch({ type: 'setModal' })
	}

	const importSettings = () => {
		const pathSelect = window.cep.fs.showOpenDialogEx(true, false, null, null, ['json'])
		if (!pathSelect?.data?.length) {
			return false
		}

		let foldersImported = 0

		for (const path of pathSelect.data) {
			const result = window.cep.fs.readFile(path)
			if (result.err) {
				nativeAlert(locale.errorImportStyles, locale.errorTitle, true)
			} else {
				try {
					const data = JSON.parse(result.data)
					if (data.exportedStyles) {
						const dataFolder = { name: data.name }
						dataFolder.id = Math.random().toString(36).substring(2, 8)
						context.dispatch({ type: 'saveFolder', data: dataFolder })

						for (const style of data.exportedStyles) {
							const dataStyle = {
								name: style.name,
								folder: dataFolder.id,
								textProps: style.textProps,
								prefixes: style.prefixes || [],
								prefixColor: style.prefixColor,
								stroke: style.stroke,
							}
							dataStyle.id = Math.random().toString(36).substring(2, 8)
							dataStyle.edited = Date.now()
							context.dispatch({ type: 'saveStyle', data: dataStyle })
						}

						foldersImported++
					} else if (
						data.folders &&
						data.styles &&
						!data.ignoreLinePrefixes &&
						!data.defaultStyleId &&
						!data.language &&
						!data.autoClosePSD &&
						!data.autoScrollStyle &&
						!data.textItemKind
					) {
						const idMap = {}

						for (const folder of data.folders) {
							const newId = Math.random().toString(36).substring(2, 8)
							idMap[folder.id] = newId
							context.dispatch({
								type: 'saveFolder',
								data: { id: newId, name: folder.name },
							})
							foldersImported++
						}

						for (const style of data.styles) {
							const newId = Math.random().toString(36).substring(2, 8)
							context.dispatch({
								type: 'saveStyle',
								data: {
									folder: style.folder ? idMap[style.folder] : null,
									prefixes: style.prefixes || [],
									prefixColor: style.prefixColor,
									textProps: style.textProps,
									stroke: style.stroke,
									edited: Date.now(),
									name: style.name,
									id: newId,
								},
							})
						}
					} else {
						context.dispatch({ type: 'import', data })
						setTimeout(() => window.location.reload(), 100)
						close()
					}
				} catch {
					nativeAlert(locale.errorImportStyles, locale.errorTitle, true)
				}
			}
		}

		if (foldersImported > 0) {
			nativeAlert(
				foldersImported > 1 ? locale.importFoldersSuccess : locale.importFolderSuccess,
				locale.successTitle,
				false
			)
		}
	}

	const exportSettings = () => {
		context.dispatch({ type: 'setModal', modal: 'export' })
	}

	const checkUpdatesNow = () => {
		checkUpdate(config.appVersion).then((data) => {
			if (data) {
				context.dispatch({ type: 'setModal', modal: 'update', data })
			} else {
				nativeAlert(locale.updateNoUpdate, locale.successTitle, false)
			}
		})
	}

	return (
		<React.Fragment>
			<div className='app-modal-header hostBrdBotContrast'>
				<div className='app-modal-title'>{locale.settingsTitle}</div>
				<button
					className='topcoat-icon-button--large--quiet'
					title={locale.close}
					onClick={close}
					type='button'
				>
					<FiX size={18} />
				</button>
			</div>
			<div className='app-modal-body'>
				<div className='app-modal-body-inner'>
					<form className='fields' onSubmit={save}>
						<div className='field'>
							<div className='field-label'>{locale.settingsTextItemKindLabel}</div>
							<div className='field-input'>
								<select
									value={pastePointText}
									onChange={changePastePointText}
									className='topcoat-textarea'
								>
									<option value=''>{locale.settingsTextItemKindBox}</option>
									<option value='1'>{locale.settingsTextItemKindPoint}</option>
								</select>
							</div>
						</div>
						<div className='field hostBrdTopContrast'>
							<div className='field-label'>{locale.settingsLinePrefixesLabel}</div>
							<div className='field-input'>
								<textarea
									rows={2}
									value={ignoreLinePrefixes}
									onChange={changeLinePrefixes}
									className='topcoat-textarea'
								/>
							</div>
							<div className='field-descr'>{locale.settingsLinePrefixesDescr}</div>
						</div>
						<div className='field hostBrdTopContrast'>
							<div className='field-label'>{locale.settingsDefaultStyleLabel}</div>
							<div className='field-input'>
								<select
									value={defaultStyleId}
									onChange={changeDefaultStyle}
									className='topcoat-textarea'
								>
									<option key='none' value=''>
										{locale.settingsDefaultStyleNone}
									</option>
									{context.state.styles.map((style) => (
										<option key={style.id} value={style.id}>
											{style.name}
										</option>
									))}
								</select>
							</div>
							<div className='field-descr'>{locale.settingsDefaultStyleDescr}</div>
						</div>
						<div className='field hostBrdTopContrast'>
							<div className='field-label'>{locale.settingsLanguageLabel}</div>
							<div className='field-input'>
								<select value={language} onChange={changeLanguage} className='topcoat-textarea'>
									{Object.entries(config.languages).map(([code, name]) => (
										<option key={code} value={code}>
											{code === 'auto' ? locale.settingsLanguageAuto : name}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className='field hostBrdTopContrast'>
							<div className='field-label'>{locale.settingsThemeLabel}</div>
							<div className='field-input'>
								<select value={theme} onChange={changeTheme} className='topcoat-textarea'>
									{Object.keys(config.themes).map((code) => {
										const key = `settingsTheme${code.replace(/(?:^|-)(\w)/g, (_, $1) =>
											$1.toUpperCase()
										)}`
										return (
											<option key={code} value={code}>
												{locale[key] || config.themes[code]}
											</option>
										)
									})}
								</select>
							</div>
						</div>
						<div className='field hostBrdTopContrast'>
							<div className='field-label'>{locale.settingsDirectionLabel}</div>
							<div className='field-input'>
								<select value={direction} onChange={changeDirection} className='topcoat-textarea'>
									<option value='ltr'>{locale.settingsDirectionLtr}</option>
									<option value='rtl'>{locale.settingsDirectionRtl}</option>
								</select>
							</div>
						</div>
						<div className='field hostBrdTopContrast'>
							<div className='field-label'>{locale.settingsMiddleEastLabel}</div>
							<div className='field-input'>
								<label className='topcoat-checkbox'>
									<input type='checkbox' checked={middleEast} onChange={changeMiddleEast} />
									<div className='topcoat-checkbox__checkmark' />
								</label>
							</div>
						</div>
						<div className='field hostBrdTopContrast'>
							<div className='field-label'>{locale.settingsAutoClosePsdLabel}</div>
							<div className='field-input'>
								<label className='topcoat-checkbox'>
									<input type='checkbox' checked={autoClosePSD} onChange={changeAutoClosePSD} />
									<div className='topcoat-checkbox__checkmark' />
								</label>
							</div>
						</div>
						<div className='field hostBrdTopContrast'>
							<div className='field-label'>{locale.settingsAutoScrollStyleLabel}</div>
							<div className='field-input'>
								<label className='topcoat-checkbox'>
									<input
										type='checkbox'
										checked={autoScrollStyle}
										onChange={changeAutoScrollStyle}
									/>
									<div className='topcoat-checkbox__checkmark' />
								</label>
							</div>
						</div>
						<div className='field hostBrdTopContrast'>
							<div className='field-label'>{locale.settingsCheckUpdatesLabel}</div>
							<div className='field-input'>
								<label className='topcoat-checkbox'>
									<input type='checkbox' checked={checkUpdates} onChange={changeCheckUpdates} />
									<div className='topcoat-checkbox__checkmark' />
								</label>
							</div>
						</div>
						<div className='field hostBrdTopContrast'>
							<div className='field-label'>{locale.shortcut}</div>
							{Object.entries(context.state.shortcut).map(([index, value]) => (
								<Shortcut key={index} value={value} index={index} />
							))}
						</div>
						<div className='field hostBrdTopContrast'>
							<button
								type='submit'
								className={edited ? 'topcoat-button--large--cta' : 'topcoat-button--large'}
							>
								<MdSave size={18} /> {locale.save}
							</button>
						</div>
					</form>
					<div className='fields hostBrdTopContrast'>
						<div className='field'>
							<button type='button' className='topcoat-button--large' onClick={importSettings}>
								<FaFileImport size={18} /> {locale.settingsImport}
							</button>
						</div>
						<div className='field'>
							<button type='button' className='topcoat-button--large' onClick={exportSettings}>
								<FaFileExport size={18} /> {locale.settingsExport}
							</button>
						</div>
						<div className='field'>
							<button type='button' className='topcoat-button--large' onClick={checkUpdatesNow}>
								{locale.settingsCheckUpdatesButton}
							</button>
						</div>
					</div>
				</div>
			</div>
		</React.Fragment>
	)
})

export default SettingsModal
