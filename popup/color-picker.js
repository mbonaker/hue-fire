/*!
 * Hue Fire
 * Copyright (C) 2022  Matteo Bonaker
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import LchHueColorPicker from "../scripts/PlaneColorPicker/Lch/LchHueColorPicker.js";
import LchChromaColorPicker from "../scripts/PlaneColorPicker/Lch/LchChromaColorPicker.js";
import LchLuminosityColorPicker from "../scripts/PlaneColorPicker/Lch/LchLuminosityColorPicker.js";
import ColorSelectionManager from "../scripts/ColorSelectionManager.js";
import StorageManager from "../scripts/Storage/StorageManager.js";
import LchColor from "../scripts/LchColor.js";
import ColorSelectionPoint from "../scripts/ColorSelectionPoint.js";
import ColorSetCollection from "./ColorSetCollection.js";
import ColorSet from "../scripts/Storage/ColorSet.js";
import ColorSetUi from "./ColorSetUi.js";
import FractionColorPicker from "../scripts/FractionColorPicker.js";

const storageManager = new StorageManager();
let selection = new ColorSelectionManager();
selection.reference.value = chroma.lch(80, 80, 80);

let pickerSelectionChangeListeners = [];

function appendPicker(picker) {
	const div = document.createElement('div');
	div.classList.add('picker');
	const planeHeader = document.createElement('h3');
	const planeHeaderLine = document.createElement('div');
	planeHeaderLine.classList.add('line');
	const checkContainer = document.createElement('div');
	checkContainer.classList.add('checkbox-container');
	const checkLabel = document.createElement('label');
	checkLabel.textContent = 'incl. compl.';
	checkLabel.setAttribute('for', 'display-complementary-color-' + picker.type);
	const displayComplementsCheckbox = document.createElement('input');
	displayComplementsCheckbox.type = 'checkbox';
	displayComplementsCheckbox.title = 'Display complementary colors too';
	displayComplementsCheckbox.classList.add('display-complementary-color');
	displayComplementsCheckbox.setAttribute('id', 'display-complementary-color-' + picker.type);
	displayComplementsCheckbox.addEventListener('change', ev => {
		picker.displayComplementaryColor = displayComplementsCheckbox.checked;
		storageManager.setDisplayComplementActive(picker.type, displayComplementsCheckbox.checked);
	});
	checkContainer.append(checkLabel);
	checkContainer.append(displayComplementsCheckbox);
	const barHeader = document.createElement('h3');
	planeHeaderLine.append(planeHeader);
	let setPlaneHeader;
	if (picker instanceof LchChromaColorPicker) {
		setPlaneHeader = color => planeHeader.textContent = `Colors With ${Math.round(color.lch()[1])} C.`;
		barHeader.textContent = 'Other Chromas';
	}
	if (picker instanceof LchLuminosityColorPicker) {
		setPlaneHeader = color => planeHeader.textContent = `Colors With ${Math.round(color.lch()[0])} L.`;
		barHeader.textContent = 'Other Luminosities';
	}
	if (picker instanceof LchHueColorPicker) {
		setPlaneHeader = color => planeHeader.textContent = `Colors With ${Math.round(color.lch()[2])} H.`;
		barHeader.textContent = 'Other Hues';
	}

	let oldSelection = selection;
	pickerSelectionChangeListeners.push(newSelection => {
		oldSelection.reference.removeChangeListener(setPlaneHeader);
		newSelection.reference.addChangeListener(setPlaneHeader);
		setPlaneHeader(newSelection.reference.value);
		oldSelection = newSelection;
	});
	selection.reference.addChangeListener(setPlaneHeader);
	setPlaneHeader(selection.reference.value);

	planeHeaderLine.append(checkContainer);
	div.append(planeHeaderLine);
	div.append(picker.canvas);
	div.append(barHeader);
	div.append(picker.barCanvas);
	document.querySelector('.pickers').appendChild(div);
	return storageManager.isDisplayComplementActive(picker.type).then(isActive => {
		displayComplementsCheckbox.checked = isActive;
		picker.displayComplementaryColor = isActive;
	}).then(() => picker.initPlane());
}

function setPickerSelection(colorPicker, newSelection) {
	colorPicker.colorSelectionManager = newSelection;
	for (const f of pickerSelectionChangeListeners) {
		f(newSelection);
	}
}

/**
 * @param {FractionColorPicker} picker
 */
function appendFractionPicker(picker) {
	picker.generate().then(() => {});
	const div = document.querySelector('.fraction-picker .canvas-container');
	div.append(picker.canvas);
}

const saveColorSetCollection = () => {
	storageManager.setColorSets(colorSetCollection.colorSets);
};
const colorSetCollection = new ColorSetCollection(document.querySelector('.color-set-selector'), saveColorSetCollection);
colorSetCollection.activeColorSelection = selection;

storageManager.getResolutionManager().then(manager => {
	const resolutionManager = manager;
	const colorPickers = [
		new LchHueColorPicker(document, resolutionManager, selection),
		new LchChromaColorPicker(document, resolutionManager, selection),
		new LchLuminosityColorPicker(document, resolutionManager, selection),
	];
	for (const colorPicker of colorPickers) {
		appendPicker(colorPicker);
	}
	const fractionColorPicker = new FractionColorPicker(document, resolutionManager, Math.floor(document.querySelector('.fraction-picker .canvas-container').getBoundingClientRect().width));
	appendFractionPicker(fractionColorPicker);
	fractionColorPicker.addColorPickedListener(color => {
		const newPoint = new ColorSelectionPoint("", color);
		selection.addPoint(newPoint);
	});
	fractionColorPicker.addColorAltPickedListener(color => {
		selection.reference.value = color;
	});
	document.querySelector('.fraction-picker .control .more').addEventListener('click', ev => {
		ev.preventDefault();
		fractionColorPicker.nFractions += 1;
	});
	document.querySelector('.fraction-picker .control .less').addEventListener('click', ev => {
		ev.preventDefault();
		fractionColorPicker.nFractions -= 1;
	});

	const setGradient0 = (color) => fractionColorPicker.startColor = color;
	const setGradient1 = (color) => fractionColorPicker.endColor = color;

	const colorSetUi = new ColorSetUi(document.querySelector('.color-list .values'), document.getElementById('color-item-template'), selection, setGradient0, setGradient1);
	colorSetUi.setColorSelectionManager(selection);
	document.addEventListener('keyup', (e) => {
		if (e.target.matches('input')) {
			return;
		}
		if (e.key === '+') {
			resolutionManager.increaseRenderResolution();
			e.preventDefault();
		} else if (e.key === '-') {
			resolutionManager.decreaseRenderResolution();
			e.preventDefault();
		}
	});
	resolutionManager.addChangeListener(() => {
		storageManager.setResolutionManager(resolutionManager);
	});
	document.querySelector('.color-list form.input').addEventListener('submit', ev => {
		ev.preventDefault();
		const textInput = ev.target.querySelector('input[type="text"]');
		const colorInput = ev.target.querySelector('input[type="color"]');
		for (const stringColor of [textInput.value, colorInput.value]) {
			if (stringColor !== '' && stringColor !== '#000000') {
				const [l, c, h] = chroma(stringColor).lch();
				const lchColor = new LchColor(l, c, h);
				const newPoint = new ColorSelectionPoint();
				newPoint.value = lchColor;
				selection.addPoint(newPoint);
			}
		}
		textInput.value = "";
		colorInput.value = "#000000";
	});
	storageManager.getColorSets().then(colorSets => {
		colorSetCollection.init(colorSets);
		colorSetCollection.addActiveColorSelectionChangeListener(newSelection => {
			colorSetUi.setColorSelectionManager(newSelection);
			for (const colorPicker of colorPickers) {
				setPickerSelection(colorPicker, newSelection);
			}
			selection = newSelection;
		});
		document.querySelector('.color-set-selector .new-selection').addEventListener('submit', e => {
			e.preventDefault();
			const textInput = e.target.querySelector('input[type="text"]');
			let colorSet;
			if (textInput.value.startsWith('{')) {
				colorSet = ColorSet.fromObject(JSON.parse(textInput.value));
			} else {
				colorSet = new ColorSet(textInput.value, selection.copy());
			}
			colorSetCollection.addColorSet(colorSet);
			textInput.value = "";
			saveColorSetCollection();
		})
	});
});
