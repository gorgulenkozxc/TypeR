/*
$.evalFile(Folder.userData + '/Adobe/CEP/extensions/typertools/app/lib/jam/jamActions-min.jsxinc');
$.evalFile(Folder.userData + '/Adobe/CEP/extensions/typertools/app/lib/jam/jamEngine-min.jsxinc');
$.evalFile(Folder.userData + '/Adobe/CEP/extensions/typertools/app/lib/jam/jamHelpers-min.jsxinc');
$.evalFile(Folder.userData + '/Adobe/CEP/extensions/typertools/app/lib/jam/jamJSON-min.jsxinc');
$.evalFile(Folder.userData + '/Adobe/CEP/extensions/typertools/app/lib/jam/jamText-min.jsxinc');
$.evalFile(Folder.userData + '/Adobe/CEP/extensions/typertools/app/lib/jam/jamStyles-min.jsxinc');
$.evalFile(Folder.userData + '/Adobe/CEP/extensions/typertools/app/lib/jam/jamUtils-min.jsxinc');
*/

/* globals app, documents, activeDocument, ScriptUI, DialogModes, LayerKind, ActionReference, ActionDescriptor, executeAction, executeActionGet, stringIDToTypeID, jamEngine, jamJSON, jamText */

var charID = {
	Back: 1113678699, // 'Back'
	Background: 1113811815, // 'Bckg'
	Bottom: 1114926957, // 'Btom'
	By: 1115234336, // 'By  '
	Channel: 1130917484, // 'Chnl'
	Contract: 1131312227, // 'Cntc'
	Document: 1147366766, // 'Dcmn'
	Expand: 1165521006, // 'Expn'
	FrameSelect: 1718838636, // 'fsel'
	Horizontal: 1215461998, // 'Hrzn'
	Layer: 1283027488, // 'Lyr '
	Left: 1281713780, // 'Left'
	Move: 1836021349, // 'move'
	None: 1315925605, // 'None'
	Null: 1853189228, // 'null'
	Offset: 1332114292, // 'Ofst'
	Ordinal: 1332896878, // 'Ordn'
	PixelUnit: 592476268, // '#Pxl'
	Point: 1349415968, // 'Pnt '
	Property: 1349677170, // 'Prpr'
	Right: 1382508660, // 'Rght'
	Select: 1936483188, // 'slct'
	Set: 1936028772, // 'setd'
	Size: 1400512544, // 'Sz  '
	Target: 1416783732, // 'Trgt'
	Text: 1417180192, // 'Txt '
	TextLayer: 1417170034, // 'TxLr'
	TextShapeType: 1413830740, // 'TEXT'
	TextStyle: 1417180243, // 'TxtS'
	TextStyleRange: 1417180276, // 'Txtt'
	To: 1411391520, // 'T   '
	Top: 1416589344, // 'Top '
	Vertical: 1450341475, // 'Vrtc'
}

function _changeToPointText() {
	var reference = new ActionReference()
	reference.putProperty(charID.Property, charID.TextShapeType)
	reference.putEnumerated(charID.TextLayer, charID.Ordinal, charID.Target)
	var descriptor = new ActionDescriptor()
	descriptor.putReference(charID.Null, reference)
	descriptor.putEnumerated(charID.To, charID.TextShapeType, charID.Point)
	executeAction(charID.Set, descriptor, DialogModes.NO)
}

function _changeToBoxText() {
	var reference = new ActionReference()
	reference.putProperty(charID.Property, charID.TextShapeType)
	reference.putEnumerated(charID.TextLayer, charID.Ordinal, charID.Target)
	var descriptor = new ActionDescriptor()
	descriptor.putReference(charID.Null, reference)
	descriptor.putEnumerated(charID.To, charID.TextShapeType, stringIDToTypeID('box'))
	executeAction(charID.Set, descriptor, DialogModes.NO)
}

function _layerIsTextLayer() {
	var layer = _getCurrent(charID.Layer, charID.Text)
	return layer.hasKey(charID.Text)
}

function _textLayerIsPointText() {
	var textKey = _getCurrent(charID.Layer, charID.Text).getObjectValue(charID.Text)
	var textType = textKey
		.getList(stringIDToTypeID('textShape'))
		.getObjectValue(0)
		.getEnumerationValue(charID.TextShapeType)
	return textType === charID.Point
}

function _convertPixelToPoint(value) {
	return (parseInt(value) / activeDocument.resolution) * 72
}

function _createCurrent(target, id) {
	var reference = new ActionReference()
	if (id > 0) reference.putProperty(charID.Property, id)
	reference.putEnumerated(target, charID.Ordinal, charID.Target)
	return reference
}

function _getCurrent(target, id) {
	return executeActionGet(_createCurrent(target, id))
}

function _deselect() {
	var reference = new ActionReference()
	reference.putProperty(charID.Channel, charID.FrameSelect)
	var descriptor = new ActionDescriptor()
	descriptor.putReference(charID.Null, reference)
	descriptor.putEnumerated(charID.To, charID.Ordinal, charID.None)
	executeAction(charID.Set, descriptor, DialogModes.NO)
}

function _getBoundsFromDescriptor(bounds) {
	var top = bounds.getInteger(charID.Top)
	var left = bounds.getInteger(charID.Left)
	var right = bounds.getInteger(charID.Right)
	var bottom = bounds.getInteger(charID.Bottom)
	return {
		top: top,
		left: left,
		right: right,
		bottom: bottom,
		width: right - left,
		height: bottom - top,
		xMid: (left + right) / 2,
		yMid: (top + bottom) / 2,
	}
}

function _getCurrentSelectionBounds() {
	var doc = _getCurrent(charID.Document, charID.FrameSelect)
	if (doc.hasKey(charID.FrameSelect)) {
		var bounds = doc.getObjectValue(charID.FrameSelect)
		return _getBoundsFromDescriptor(bounds)
	}
}

function _getCurrentTextLayerBounds() {
	var boundsTypeId = stringIDToTypeID('bounds')
	var bounds = _getCurrent(charID.Layer, boundsTypeId).getObjectValue(boundsTypeId)
	return _getBoundsFromDescriptor(bounds)
}

function _modifySelectionBounds(amount) {
	if (amount == 0) return
	var size = new ActionDescriptor()
	size.putUnitDouble(charID.By, charID.PixelUnit, Math.abs(amount))
	executeAction(amount > 0 ? charID.Expand : charID.Contract, size, DialogModes.NO)
}

function _createMagicWandSelection(tolerance) {
	try {
		var bounds = _getCurrentTextLayerBounds()
		var x = Math.max(bounds.left - 5, 0)
		var y = Math.max(bounds.yMid, 0)
		var desc = new ActionDescriptor()
		var ref = new ActionReference()
		ref.putProperty(charID.Channel, charID.FrameSelect)
		desc.putReference(charID.Null, ref)

		var pos = new ActionDescriptor()
		pos.putUnitDouble(charID.Horizontal, charID.PixelUnit, x)
		pos.putUnitDouble(charID.Vertical, charID.PixelUnit, y)
		desc.putObject(charID.To, stringIDToTypeID('paint'), pos)

		desc.putInteger(stringIDToTypeID('tolerance'), tolerance || 20)
		desc.putBoolean(stringIDToTypeID('merged'), true)
		desc.putBoolean(stringIDToTypeID('antiAlias'), true)
		executeAction(charID.Set, desc, DialogModes.NO)
	} catch (e) {}
}

function _moveLayer(offsetX, offsetY) {
	var amount = new ActionDescriptor()
	amount.putUnitDouble(charID.Horizontal, charID.PixelUnit, offsetX)
	amount.putUnitDouble(charID.Vertical, charID.PixelUnit, offsetY)
	var target = new ActionDescriptor()
	target.putReference(charID.Null, _createCurrent(charID.Layer))
	target.putObject(charID.To, charID.Offset, amount)
	executeAction(charID.Move, target, DialogModes.NO)
}

/**
 * Retrieve stroke information from the active layer.
 * Returns null if no stroke is found.
 */
function _getLayerStroke() {
	var ref = new ActionReference()
	ref.putProperty(charIDToTypeID('Prpr'), charIDToTypeID('Lefx'))
	ref.putEnumerated(charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'))
	var desc = executeActionGet(ref)
	if (!desc.hasKey(charIDToTypeID('Lefx'))) return null

	var fx = desc.getObjectValue(charIDToTypeID('Lefx'))
	if (!fx.hasKey(charIDToTypeID('FrFX'))) return null

	var fr = fx.getObjectValue(charIDToTypeID('FrFX'))
	var col = fr.getObjectValue(charIDToTypeID('Clr '))

	return {
		enabled: fr.getBoolean(charIDToTypeID('enab')),
		position:
			fr.getEnumerationValue(charIDToTypeID('Styl')) == charIDToTypeID('OutF') ? 'outer' : 'other',
		size: fr.getUnitDoubleValue(charIDToTypeID('Sz  ')),
		opacity: fr.getUnitDoubleValue(charIDToTypeID('Opct')),
		color: {
			r: col.getDouble(charIDToTypeID('Rd  ')),
			g: col.getDouble(charIDToTypeID('Grn ')),
			b: col.getDouble(charIDToTypeID('Bl  ')),
		},
	}
}

/**
 * Apply or update a stroke on the active layer.
 * @param {Object} stroke - {size, color:{r,g,b}, opacity, enabled}
 *                          position is forced to "outer".
 */
function _setLayerStroke(stroke) {
	if (!stroke || (stroke.size <= 0 && stroke.enabled !== true)) return

	var d = new ActionDescriptor()
	var r = new ActionReference()
	r.putProperty(charIDToTypeID('Prpr'), charIDToTypeID('Lefx'))
	r.putEnumerated(charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'))
	d.putReference(charIDToTypeID('null'), r)

	var fx = new ActionDescriptor()
	fx.putUnitDouble(charIDToTypeID('Scl '), charIDToTypeID('#Prc'), 100)

	var fr = new ActionDescriptor()
	fr.putBoolean(charIDToTypeID('enab'), true)
	fr.putBoolean(stringIDToTypeID('present'), true)
	fr.putBoolean(stringIDToTypeID('showInDialog'), true)

	fr.putEnumerated(charIDToTypeID('Styl'), charIDToTypeID('FStl'), charIDToTypeID('OutF'))
	fr.putEnumerated(charIDToTypeID('PntT'), charIDToTypeID('FrFl'), charIDToTypeID('SClr'))
	fr.putEnumerated(charIDToTypeID('Md  '), charIDToTypeID('BlnM'), charIDToTypeID('Nrml'))

	fr.putUnitDouble(charIDToTypeID('Sz  '), charIDToTypeID('#Pxl'), stroke.size || 3)
	fr.putUnitDouble(charIDToTypeID('Opct'), charIDToTypeID('#Prc'), stroke.opacity || 100)

	var c = new ActionDescriptor()
	c.putDouble(charIDToTypeID('Rd  '), stroke.color.r)
	c.putDouble(charIDToTypeID('Grn '), stroke.color.g)
	c.putDouble(charIDToTypeID('Bl  '), stroke.color.b)
	fr.putObject(charIDToTypeID('Clr '), charIDToTypeID('RGBC'), c)

	fx.putObject(charIDToTypeID('FrFX'), charIDToTypeID('FrFX'), fr)
	d.putObject(charIDToTypeID('T   '), charIDToTypeID('Lefx'), fx)

	executeAction(charIDToTypeID('setd'), d, DialogModes.NO)
}

function _setDiacXOffset(val) {
	var d = new ActionDescriptor()
	var r = new ActionReference()
	r.putProperty(charIDToTypeID('Prpr'), charIDToTypeID('TxtS'))
	r.putEnumerated(charIDToTypeID('TxLr'), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'))
	d.putReference(charIDToTypeID('null'), r)

	var t = new ActionDescriptor()
	t.putInteger(stringIDToTypeID('textOverrideFeatureName'), 808466486)
	t.putInteger(stringIDToTypeID('typeStyleOperationType'), 3)
	t.putUnitDouble(stringIDToTypeID('diacXOffset'), charIDToTypeID('#Pxl'), val)
	d.putObject(charIDToTypeID('T   '), charIDToTypeID('TxtS'), t)

	executeAction(charIDToTypeID('setd'), d, DialogModes.NO)
}

function _setMarkYOffset(val) {
	var d = new ActionDescriptor()
	var r = new ActionReference()
	r.putProperty(charIDToTypeID('Prpr'), charIDToTypeID('TxtS'))
	r.putEnumerated(charIDToTypeID('TxLr'), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'))
	d.putReference(charIDToTypeID('null'), r)

	var t = new ActionDescriptor()
	t.putInteger(stringIDToTypeID('textOverrideFeatureName'), 808466488)
	t.putInteger(stringIDToTypeID('typeStyleOperationType'), 3)
	t.putUnitDouble(stringIDToTypeID('markYDistFromBaseline'), charIDToTypeID('#Pxl'), val)
	d.putObject(charIDToTypeID('T   '), charIDToTypeID('TxtS'), t)

	executeAction(charIDToTypeID('setd'), d, DialogModes.NO)
}

function _applyMiddleEast(textStyle) {
	if (!textStyle) return
	if (textStyle.diacXOffset != null) _setDiacXOffset(textStyle.diacXOffset)
	if (textStyle.markYDistFromBaseline != null) _setMarkYOffset(textStyle.markYDistFromBaseline)
}

var securitySize = 20

function _createAndSetLayerText(data, width, height) {
	data.style.textProps.layerText.textKey = data.text.replace(/\n+/g, '')
	data.style.textProps.layerText.textStyleRange[0].to = data.text.length
	data.style.textProps.layerText.paragraphStyleRange[0].to = data.text.length
	var sizeProp = data.style.textProps.layerText.textStyleRange[0].textStyle.size
	if (typeof sizeProp !== 'number') {
		try {
			var textParams = jamText.getLayerText()
			securitySize = textParams.layerText.textStyleRange[0].textStyle.size
		} catch (error) {}
		data.style.textProps.layerText.textStyleRange[0].textStyle.size = securitySize
	}
	data.style.textProps.layerText.textShape = [
		{
			textType: 'box',
			orientation: 'horizontal',
			bounds: {
				top: 0,
				left: 0,
				right: _convertPixelToPoint(width),
				bottom: _convertPixelToPoint(height),
			},
		},
	]
	jamEngine.jsonPlay('make', {
		target: ['<reference>', [['textLayer', ['<class>', null]]]],
		using: jamText.toLayerTextObject(data.style.textProps),
	})
	_applyMiddleEast(data.style.textProps.layerText.textStyleRange[0].textStyle)
	if (data.style.stroke) {
		_setLayerStroke(data.style.stroke)
	}
}

function _setTextBoxSize(width, height) {
	var box = [
		{
			textType: 'box',
			orientation: 'horizontal',
			bounds: {
				top: 0,
				left: 0,
				right: _convertPixelToPoint(width),
				bottom: _convertPixelToPoint(height),
			},
		},
	]
	jamText.setLayerText({ layerText: { textShape: box } })
}

function _checkSelection() {
	var selection = _getCurrentSelectionBounds()
	if (selection === undefined) {
		return { error: 'noSelection' }
	}
	selection = _getCurrentSelectionBounds()
	if (selection === undefined || selection.width * selection.height < 200) {
		return { error: 'smallSelection' }
	}
	return selection
}

function _forEachSelectedLayer(action) {
	var selectedLayers = []
	var reference = new ActionReference()
	var targetLayers = stringIDToTypeID('targetLayers')
	reference.putProperty(charID.Property, targetLayers)
	reference.putEnumerated(charID.Document, charID.Ordinal, charID.Target)
	var doc = executeActionGet(reference)
	if (doc.hasKey(targetLayers)) {
		doc = doc.getList(targetLayers)
		var ref2 = new ActionReference()
		ref2.putProperty(charID.Property, charID.Background)
		ref2.putEnumerated(charID.Layer, charID.Ordinal, charID.Back)
		var offset = executeActionGet(ref2).getBoolean(charID.Background) ? 0 : 1
		for (var i = 0; i < doc.count; i++) {
			selectedLayers.push(doc.getReference(i).getIndex() + offset)
		}
	}
	if (selectedLayers.length > 1) {
		for (var j = 0; j < selectedLayers.length; j++) {
			var descr = new ActionDescriptor()
			var ref3 = new ActionReference()
			ref3.putIndex(charID.Layer, selectedLayers[j])
			descr.putReference(charID.Null, ref3)
			executeAction(charID.Select, descr, DialogModes.NO)
			action(selectedLayers[j])
		}
		var ref4 = new ActionReference()
		for (var k = 0; k < selectedLayers.length; k++) {
			ref4.putIndex(charID.Layer, selectedLayers[k])
		}
		var descr2 = new ActionDescriptor()
		descr2.putReference(charID.Null, ref4)
		executeAction(charID.Select, descr2, DialogModes.NO)
	} else if (selectedLayers.length === 1) {
		action(selectedLayers[0])
	}
}

/* ========================================================= */
/* ============ full methods for suspendHistory ============ */
/* ========================================================= */

var setActiveLayerTextData
var setActiveLayerTextResult

function _setActiveLayerText() {
	if (!setActiveLayerTextData) {
		setActiveLayerTextResult = ''
		return
	} else if (!documents.length) {
		setActiveLayerTextResult = 'doc'
		return
	} else if (!_layerIsTextLayer()) {
		setActiveLayerTextResult = 'layer'
		return
	}
	var dataText = setActiveLayerTextData.text
	var dataStyle = setActiveLayerTextData.style

	_forEachSelectedLayer(function () {
		var oldBounds = _getCurrentTextLayerBounds()
		var isPoint = _textLayerIsPointText()
		if (isPoint) _changeToBoxText()
		var oldTextParams = jamText.getLayerText()
		var newTextParams
		if (dataText && dataStyle) {
			newTextParams = dataStyle.textProps
			if (
				newTextParams.layerText.textStyleRange[0].textStyle.size == null &&
				oldTextParams.layerText.textStyleRange &&
				oldTextParams.layerText.textStyleRange[0] &&
				oldTextParams.layerText.textStyleRange[0].textStyle.size != null
			) {
				newTextParams.layerText.textStyleRange[0].textStyle.size =
					oldTextParams.layerText.textStyleRange[0].textStyle.size
			}
			newTextParams.layerText.textKey = dataText.replace(/\n+/g, '')
			newTextParams.layerText.textStyleRange[0].to = dataText.length
			newTextParams.layerText.paragraphStyleRange[0].to = dataText.length
		} else if (dataText) {
			newTextParams = {
				layerText: {
					textKey: dataText.replace(/\n+/g, ''),
				},
			}
			if (oldTextParams.layerText.textStyleRange && oldTextParams.layerText.textStyleRange[0]) {
				newTextParams.layerText.textStyleRange = [oldTextParams.layerText.textStyleRange[0]]
				newTextParams.layerText.textStyleRange[0].to = dataText.length
			}
			if (
				oldTextParams.layerText.paragraphStyleRange &&
				oldTextParams.layerText.paragraphStyleRange[0]
			) {
				newTextParams.layerText.paragraphStyleRange = [
					oldTextParams.layerText.paragraphStyleRange[0],
				]
				newTextParams.layerText.paragraphStyleRange[0].to = dataText.length
			}
		} else if (dataStyle) {
			var text = oldTextParams.layerText.textKey || ''
			newTextParams = dataStyle.textProps
			newTextParams.layerText.textStyleRange[0].to = text.length
			newTextParams.layerText.paragraphStyleRange[0].to = text.length
		}
		newTextParams.layerText.antiAlias = oldTextParams.layerText.antiAlias || 'antiAliasSmooth'
		newTextParams.layerText.textShape = [oldTextParams.layerText.textShape[0]]
		newTextParams.layerText.textShape[0].bounds.bottom *= 15
		newTextParams.typeUnit = oldTextParams.typeUnit
		jamText.setLayerText(newTextParams)
		_applyMiddleEast(newTextParams.layerText.textStyleRange[0].textStyle)
		if (dataStyle && dataStyle.stroke) {
			_setLayerStroke(dataStyle.stroke)
		}
		var newBounds = _getCurrentTextLayerBounds()
		if (isPoint) {
			_changeToPointText()
		} else {
			var textSize = 12
			var styleSize = dataStyle && dataStyle.textProps.layerText.textStyleRange[0].textStyle.size
			if (styleSize != null) {
				textSize = styleSize
			} else if (
				oldTextParams.layerText.textStyleRange &&
				oldTextParams.layerText.textStyleRange[0] &&
				oldTextParams.layerText.textStyleRange[0].textStyle.size != null
			) {
				textSize = oldTextParams.layerText.textStyleRange[0].textStyle.size
			}
			newTextParams.layerText.textShape[0].bounds.bottom = _convertPixelToPoint(
				newBounds.height + textSize + 2
			)
			jamText.setLayerText({
				layerText: {
					textShape: newTextParams.layerText.textShape,
				},
			})
		}
		if (!oldBounds.bottom) oldBounds = newBounds
		var offsetX = oldBounds.xMid - newBounds.xMid
		var offsetY = oldBounds.yMid - newBounds.yMid
		_moveLayer(offsetX, offsetY)
	})

	setActiveLayerTextResult = ''
}

var createTextLayerInSelectionData
var createTextLayerInSelectionPoint
var createTextLayerInSelectionResult

function _createTextLayerInSelection() {
	if (!documents.length) {
		createTextLayerInSelectionResult = 'doc'
		return
	}
	var selection = _checkSelection()
	if (selection.error) {
		createTextLayerInSelectionResult = selection.error
		return
	}
	var width = selection.width
	var height = selection.height * 15
	_createAndSetLayerText(createTextLayerInSelectionData, width, height)
	var bounds = _getCurrentTextLayerBounds()
	if (createTextLayerInSelectionPoint) {
		_changeToPointText()
	} else {
		var textParams = jamText.getLayerText()
		var textSize = textParams.layerText.textStyleRange[0].textStyle.size
		_setTextBoxSize(width, bounds.height + textSize + 2)
	}
	var offsetX = selection.xMid - bounds.xMid
	var offsetY = selection.yMid - bounds.yMid
	_moveLayer(offsetX, offsetY)
	createTextLayerInSelectionResult = ''
}

var alignTextLayerToSelectionResult

function _alignTextLayerToSelection() {
	if (!documents.length) {
		alignTextLayerToSelectionResult = 'doc'
		return
	} else if (!_layerIsTextLayer()) {
		alignTextLayerToSelectionResult = 'layer'
		return
	}
	var selection = _checkSelection()
	if (selection.error) {
		if (selection.error === 'noSelection') {
			_createMagicWandSelection(20)
			selection = _checkSelection()
		}
		if (selection.error) {
			createTextLayerInSelectionResult = selection.error
			return
		}
	}
	var isPoint = _textLayerIsPointText()
	var bounds = _getCurrentTextLayerBounds()
	if (isPoint) {
		_changeToPointText()
	}
	_deselect()
	var offsetX = selection.xMid - bounds.xMid
	var offsetY = selection.yMid - bounds.yMid
	_moveLayer(offsetX, offsetY)
	alignTextLayerToSelectionResult = ''
}

var changeActiveLayerTextSizeVal
var changeActiveLayerTextSizeResult

var _lastOpenedDocId = null

function _changeActiveLayerTextSize() {
	if (!documents.length) {
		changeActiveLayerTextSizeResult = 'doc'
		return
	} else if (!_layerIsTextLayer()) {
		changeActiveLayerTextSizeResult = 'layer'
		return
	} else if (!changeActiveLayerTextSizeVal) {
		changeActiveLayerTextSizeResult = ''
		return
	}

	_forEachSelectedLayer(function () {
		var oldTextParams = jamText.getLayerText()
		var text = oldTextParams.layerText.textKey.replace(/\n+/g, '')
		if (!text) {
			changeActiveLayerTextSizeResult = 'layer'
			return
		}
		var oldBounds = _getCurrentTextLayerBounds()
		var isPoint = _textLayerIsPointText()
		var newTextParams = {
			typeUnit: oldTextParams.typeUnit,
			layerText: {
				textKey: text,
				textGridding: oldTextParams.layerText.textGridding || 'none',
				orientation: oldTextParams.layerText.orientation || 'horizontal',
				antiAlias: oldTextParams.layerText.antiAlias || 'antiAliasSmooth',
				textStyleRange: [oldTextParams.layerText.textStyleRange[0]],
			},
		}
		if (oldTextParams.layerText.paragraphStyleRange) {
			var oldParStyle = oldTextParams.layerText.paragraphStyleRange[0].paragraphStyle
			newTextParams.layerText.paragraphStyleRange = [oldTextParams.layerText.paragraphStyleRange[0]]
			newTextParams.layerText.paragraphStyleRange[0].paragraphStyle.textEveryLineComposer =
				oldParStyle.textEveryLineComposer || false
			newTextParams.layerText.paragraphStyleRange[0].paragraphStyle.burasagari =
				oldParStyle.burasagari || 'burasagariNone'
			newTextParams.layerText.paragraphStyleRange[0].to = text.length
		}
		var oldSize = newTextParams.layerText.textStyleRange[0].textStyle.size
		var newTextSize = oldSize + changeActiveLayerTextSizeVal
		newTextParams.layerText.textStyleRange[0].textStyle.size = newTextSize

		// Ajuster l'interligne
		const textStyle = newTextParams.layerText.textStyleRange[0].textStyle
		if (textStyle.autoLeading || textStyle.leading === undefined) {
			// Si l'interligne est en auto, on le laisse en auto
			textStyle.autoLeading = true
			// On supprime la propriété leading si elle existe pour s'assurer que l'auto soit appliqué
			delete textStyle.leading
		} else {
			// Sinon, on ajuste l'interligne de la même valeur que la taille du texte
			const oldLeading = textStyle.leading
			const newLeading = oldLeading + changeActiveLayerTextSizeVal
			textStyle.leading = newLeading
			textStyle.autoLeading = false
		}

		newTextParams.layerText.textStyleRange[0].to = text.length
		if (!isPoint) {
			var ratio = newTextSize / oldSize
			newTextParams.layerText.textShape = [oldTextParams.layerText.textShape[0]]
			var shapeBounds = newTextParams.layerText.textShape[0].bounds
			shapeBounds.top *= ratio
			shapeBounds.left *= ratio
			shapeBounds.bottom *= ratio
			shapeBounds.right *= ratio
		}
		jamText.setLayerText(newTextParams)
		_applyMiddleEast(newTextParams.layerText.textStyleRange[0].textStyle)
		var newBounds = _getCurrentTextLayerBounds()
		var offsetX = oldBounds.xMid - newBounds.xMid
		var offsetY = oldBounds.yMid - newBounds.yMid
		_moveLayer(offsetX, offsetY)
	})

	changeActiveLayerTextSizeResult = ''
}

function _changeSize_alt() {
	var increasing = changeActiveLayerTextSizeVal > 0
	_forEachSelectedLayer(function () {
		var a = new ActionReference()
		a.putProperty(charID.Property, charID.Text)
		a.putEnumerated(charID.Layer, charID.Ordinal, charID.Target)
		var currentLayer = executeActionGet(a)
		if (currentLayer.hasKey(charID.Text)) {
			var settings = currentLayer.getObjectValue(charID.Text)
			var textStyleRange = settings.getList(charID.TextStyleRange)
			var sizes = []
			var units = []
			var proceed = true
			for (var i = 0; i < textStyleRange.count; i++) {
				var style = textStyleRange.getObjectValue(i).getObjectValue(charID.TextStyle)
				sizes[i] = style.getDouble(charID.Size)
				units[i] = style.getUnitDoubleType(charID.Size)
				if (i > 0 && (sizes[i] !== sizes[i - 1] || units[i] !== units[i - 1])) {
					proceed = false
					break
				}
			}
			var amount = 0.2 // mm
			if (units[0] === charID.PixelUnit) amount = 1 // pixel
			else if (units[0] === 592473716) amount = 0.5 // point
			if (!increasing) amount *= -1
			if (proceed) {
				var aa = new ActionDescriptor()
				var d = new ActionReference()
				d.putProperty(charID.Property, charID.TextStyle)
				d.putEnumerated(charID.TextLayer, charID.Ordinal, charID.Target)
				aa.putReference(charID.Null, d)
				var e = new ActionDescriptor()
				e.putUnitDouble(charID.Size, units[0], sizes[0] + amount)
				aa.putObject(charID.To, charID.TextStyle, e)
				executeAction(charID.Set, aa, DialogModes.NO)
			}
		}
	})
	changeActiveLayerTextSizeResult = ''
}

/* ======================================================== */
/* ==================== public methods ==================== */
/* ======================================================== */

function nativeAlert(data) {
	if (!data) return ''
	alert(data.text, data.title, data.isError)
}

function nativeConfirm(data) {
	if (!data) return ''
	var result = confirm(data.text, false, data.title)
	return result ? '1' : ''
}

function getUserFonts() {
	var fontsArr = []
	for (var i = 0; i < app.fonts.length; i++) {
		var font = app.fonts[i]
		fontsArr.push({
			name: font.name,
			postScriptName: font.postScriptName,
			family: font.family,
			style: font.style,
		})
	}
	return jamJSON.stringify({
		fonts: fontsArr,
	})
}

function getHotkeyPressed() {
	var state = ScriptUI.environment.keyboardState
	var string = 'a'

	if (state.metaKey) {
		string += 'WINa'
	}
	if (state.ctrlKey) {
		string += 'CTRLa'
	}
	if (state.altKey) {
		string += 'ALTa'
	}
	if (state.shiftKey) {
		string += 'SHIFTa'
	}
	if (state.keyName) {
		string += state.keyName.toUpperCase() + 'a'
	}
	return string
}

function getActiveLayerText() {
	if (!documents.length) {
		return ''
	} else if (activeDocument.activeLayer.kind != LayerKind.TEXT) {
		return ''
	}
	return jamJSON.stringify({
		textProps: jamText.getLayerText(),
		stroke: _getLayerStroke(),
	})
}

function setActiveLayerText(data) {
	setActiveLayerTextData = data
	app.activeDocument.suspendHistory('TyperTools Change', '_setActiveLayerText()')
	return setActiveLayerTextResult
}

function createTextLayerInSelection(data, point) {
	createTextLayerInSelectionData = data
	createTextLayerInSelectionPoint = point
	app.activeDocument.suspendHistory('TyperTools Paste', '_createTextLayerInSelection()')
	return createTextLayerInSelectionResult
}

function alignTextLayerToSelection() {
	app.activeDocument.suspendHistory('TyperTools Align', '_alignTextLayerToSelection()')
	return alignTextLayerToSelectionResult
}

function changeActiveLayerTextSize(val) {
	changeActiveLayerTextSizeVal = val
	app.activeDocument.suspendHistory('TyperTools Resize', '_changeActiveLayerTextSize()')
	return changeActiveLayerTextSizeResult
}

function openFile(path, autoClose) {
	if (autoClose && _lastOpenedDocId !== null) {
		for (var i = 0; i < app.documents.length; i++) {
			var doc = app.documents[i]
			if (doc.id === _lastOpenedDocId) {
				try {
					doc.close(SaveOptions.SAVECHANGES)
				} catch (e) {}
				break
			}
		}
	}
	var newDoc = app.open(File(path))
	if (autoClose) {
		_lastOpenedDocId = newDoc.id
	}
}
