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

function appendPicker(picker) {
	picker.refreshPlane().then(() => {});
	const div = document.createElement('div');
	div.classList.add('picker');
	const planeHeader = document.createElement('h3');
	const barHeader = document.createElement('h3');
	if (picker instanceof LchChromaColorPicker) {
		planeHeader.textContent = 'Constant Chroma';
		barHeader.textContent = 'Available Chromas';
	}
	if (picker instanceof LchLuminosityColorPicker) {
		planeHeader.textContent = 'Constant Luminosity';
		barHeader.textContent = 'Available Luminosities';
	}
	if (picker instanceof LchHueColorPicker) {
		planeHeader.textContent = 'Constant Hue';
		barHeader.textContent = 'Available Hues';
	}
	div.append(planeHeader);
	div.append(picker.canvas);
	div.append(barHeader);
	div.append(picker.barCanvas);
	document.querySelector('.pickers').appendChild(div);
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
				colorPicker.colorSelectionManager = newSelection;
			}
			selection = newSelection;
		});
		document.querySelector('.color-set-selector .new-selection').addEventListener('submit', e => {
			e.preventDefault();
			const textInput = e.target.querySelector('input[type="text"]');
			colorSetCollection.addColorSet(new ColorSet(textInput.value, selection.copy()));
			textInput.value = "";
			saveColorSetCollection();
		})
	});
});
