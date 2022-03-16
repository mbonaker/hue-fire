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

storageManager.getColorSets().then(colorSets => {
	if (colorSets.length > 0) {
		storageManager.getCurrentSelectionIndex().then(index => {
			if (index !== null)
				init(colorSets, colorSets[index]);
			else
				init(colorSets, colorSets[0]);
		});
	} else {
		let colorSet = new ColorSet("unnamed", new ColorSelectionManager());
		do {
            colorSet.colorSelectionManager.reference.value = chroma.hcl(Math.random() * 360, Math.random() * 100, Math.random() * 100);
		} while (colorSet.colorSelectionManager.reference.value.clipped());
		init([colorSet], colorSet);
	}
});

function init(colorSets, colorSet) {

	let selection = colorSet.colorSelectionManager;

	let pickerSelectionChangeListeners = [];

	function appendPicker(picker) {
		const div = document.createElement('div');
		div.classList.add('picker');
		const planeHeader = document.createElement('h3');
		const planeHeaderLine = document.createElement('div');
		planeHeaderLine.classList.add('line');
		planeHeaderLine.append(planeHeader);
		let setPlaneHeader;
		if (picker instanceof LchChromaColorPicker) {
			setPlaneHeader = color => planeHeader.textContent = `Colors With ${Math.round(color.lch()[1])} C.`;
		}
		if (picker instanceof LchLuminosityColorPicker) {
			setPlaneHeader = color => planeHeader.textContent = `Colors With ${Math.round(color.lch()[0])} L.`;
		}
		if (picker instanceof LchHueColorPicker) {
			setPlaneHeader = color => planeHeader.textContent = `Colors With ${Math.round(color.lch()[2])} H.`;
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

		// div.append(planeHeaderLine);
		div.append(picker.canvas);
		div.append(picker.barCanvas);
		document.querySelector('.pickers').appendChild(div);
		return picker.initPlane();
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
	const statusLineElement = document.querySelector('.status-line .show-current');
    statusLineElement.textContent = '';
	const colorSetCollection = new ColorSetCollection(document.querySelector('.color-set-selector'), saveColorSetCollection);
	colorSetCollection.addColorSetAddListener(newColorSet => {
		const newSelection = newColorSet.colorSelectionManager;
		newSelection.reference.addChangeListener(() => {
			saveColorSetCollection();
		});
		newSelection.addPointAddListener(() => {
			saveColorSetCollection();
		});
		newSelection.contemplation.addChangeListener(newColor => {
			const [h, c, l] = newColor.hcl();
			statusLineElement.textContent = `hcl(${Math.round(h)}°, ${Math.round(c)}, ${Math.round(l)}%)`;
		});
	});
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
		const complementsCheckbox = document.getElementById("show-complements-preference");
		document.getElementById("show-complements-preference").addEventListener('click', ev => {
			for (const colorPicker of colorPickers)
				colorPicker.displayComplementaryColor = complementsCheckbox.checked;
			storageManager.setDisplayComplementActive('all', complementsCheckbox.checked);
		});
		storageManager.isDisplayComplementActive('all').then(active => {
			complementsCheckbox.checked = active;
			for (const colorPicker of colorPickers)
				colorPicker.displayComplementaryColor = active;
		});
		const fractionColorPicker = new FractionColorPicker(document, resolutionManager, Math.floor(document.querySelector('.fraction-picker .canvas-container').getBoundingClientRect().width));
		document.querySelector('.fraction-picker').classList.add('unused');
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

		const colorSetUi = new ColorSetUi(document.querySelector('.color-list'), document.getElementById('color-item-template'), selection, setGradient0, setGradient1);
		colorSetUi.colorSelectionManager = selection;
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
		document.querySelector('.color-list form.new').addEventListener('submit', ev => {
			ev.preventDefault();
			const [l, c, h] = chroma(prompt(`Type a color code.\nSome examples are:\n - rgb(80, 80, 80)\n - #fff\n - #5b9efd\n - hsla(120, 100%, 20%, 0.5)\n - blue`)).lch();
			const lchColor = new LchColor(l, c, h);
			const newPoint = new ColorSelectionPoint();
			newPoint.value = lchColor;
			selection.addPoint(newPoint);
			colorSetCollection.saveCurrent();
		});
		colorSetCollection.init(colorSets);
		colorSetCollection.addActiveColorSelectionChangeListener(newSelection => {
			colorSetUi.colorSelectionManager = newSelection;
			for (const colorPicker of colorPickers) {
				setPickerSelection(colorPicker, newSelection);
			}
			selection = newSelection;
			storageManager.setCurrentSelectionIndex(colorSetCollection.selectionIndex);
		});
		document.querySelector('.open-color-set-selector').addEventListener('click', e => {
			e.preventDefault();
			colorSetCollection.open();
		});
		document.querySelector('.status-line .new-palette').addEventListener('click', e => {
			e.preventDefault();
			let colorSet;
			colorSet = new ColorSet("", new ColorSelectionManager());
			colorSet.colorSelectionManager.reference.value = new LchColor(0, 0, 0);
			colorSetCollection.addColorSet(colorSet);
			colorSetCollection.activeColorSelection = colorSet.colorSelectionManager;
			saveColorSetCollection();
		});
	});
}
