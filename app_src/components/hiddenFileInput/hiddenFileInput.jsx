import React from 'react'

import { useContext } from '../../context'

const allowed = ['psd', 'png', 'jpg', 'jpeg']

export default React.forwardRef(function HiddenFileInput(_, ref) {
	const context = useContext()

	function onChange(e) {
		const files = Array.from(e.target.files || []).filter((file) =>
			allowed.includes(file.name.split('.').at(-1).toLowerCase())
		)

		if (!files.length) {
			return
		}

		const images = files
			.map((f) => {
				const baseName = f.name.replace(/\.[^.]+$/, '')
				return { name: f.name, baseName, path: f.path || f.name }
			})
			.sort((a, b) =>
				a.baseName.localeCompare(b.baseName, undefined, {
					numeric: true,
					sensitivity: 'base',
				})
			)

		context.dispatch({ type: 'setImages', images })
		e.target.value = ''
	}

	return (
		<input
			accept={allowed.map((ext) => `.${ext}`).join(',')}
			style={{ display: 'none' }}
			onChange={onChange}
			type='file'
			ref={ref}
			multiple
		/>
	)
})
