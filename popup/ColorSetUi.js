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

import LchColor from "../scripts/LchColor.js";

export default class ColorSetUi {
	/** @type {HTMLDivElement} _el */
	_el;
	/** @type {ColorSelectionManager} */
	_selection;
	_points = [];
	/** @type {HTMLDivElement} _referenceEl */
	_referenceEl = null;
	_selectionChangeListeners = [];
	_colorTemplate;
	_setGradient0;
	_setGradient1;
	/**
	 * @param {HTMLDivElement} el
	 * @param {HTMLTemplateElement} colorElementTemplate
	 * @param {ColorSelectionManager} selection
	 * @param setGradient0
	 * @param setGradient1
	 */
	constructor(el, colorElementTemplate, selection, setGradient0, setGradient1) {
		this._el = el;
		this._selection = selection;
		this._colorTemplate = colorElementTemplate;
		this._referenceEl = this._addColor(selection.reference, '').colorDiv;
		this._setGradient0 = setGradient0;
		this._setGradient1 = setGradient1;
	}

	/**
	 * @param {ColorSelectionPoint} point
	 */
	onAddPoint(point) {
		const {colorDiv} = this._addColor(point, point.name);

		colorDiv.addEventListener('mouseenter', () => {
			point.hoverStart();
		});
		colorDiv.addEventListener('mouseleave', () => {
			point.hoverStop();
		});

		this._points.push([
			point,
			colorDiv,
			() => {
				colorDiv.remove();
			}
		]);
	}

	/**
	 * @param {ColorSelection} color
	 * @param {string} name
	 */
	_addColor(color, name) {
		const colorDiv = this._colorTemplate.content.querySelector('.color').cloneNode(true);

		colorDiv.addEventListener('mouseenter', e => {
			e.preventDefault();
			this._selection._contemplation.value = color.value;
		});
		colorDiv.addEventListener('mouseleave', e => {
			e.preventDefault();
			this._selection._contemplation.value = this._selection.reference.value;
		});
		colorDiv.addEventListener('contextmenu', e => {
			e.preventDefault();
			colorDiv.focus();
			colorDiv.classList.toggle('show-context-menu');
		});
		colorDiv.addEventListener('blur', e => {
			if (!e.currentTarget.contains(e.relatedTarget)) {
				colorDiv.classList.remove('show-context-menu');
			}
		});

		if (color === this._selection.reference) {
			colorDiv.classList.add('reference');
		}

		for (const button of colorDiv.querySelectorAll('.context-menu-action')) {
			if (button.dataset.action === 'remove' && color === this._selection.reference) {
				button.remove();
			}
			button.addEventListener('click', event => {
				const currentColor = new LchColor(parseFloat(colorDiv.dataset.l), parseFloat(colorDiv.dataset.c), parseFloat(colorDiv.dataset.h));
				event.preventDefault();
				switch (button.dataset.action) {
					case 'copy-hex': this._copyHex(currentColor); break;
					case 'copy-lch': this._copyLch(currentColor); break;
					case 'remove': this._selection.removePoint(color); break;
					case 'gradient-1': this._setGradient0(currentColor); break;
					case 'gradient-2': this._setGradient1(currentColor); break;
				}
				colorDiv.classList.remove('show-context-menu');
			});
		}

		this._updateColor(color, colorDiv);

		this._el.append(colorDiv);
		return {colorDiv};
	}

	removeHtml() {
		this._el.remove();
	}

	_copyHex(color) {
		navigator.clipboard.writeText(color.hex());
	}

	_copyLch(color) {
		const [l, c, h] = color.lch().map(Math.round);
		navigator.clipboard.writeText(color.css('lch'));
	}

	_updateColor(color, div) {
		for (const slot of div.querySelectorAll('.set-content')) {
			if (slot.dataset.content === 'hex') {
				slot.textContent = color.value.hex();
			}
			if (slot.dataset.content === 'lch') {
				const [l, c, h] = color.value.lch().map(Math.round);
				slot.textContent = `${l}, ${c}, ${h}`;
			}
		}

		{
			const [l, c, h] = color.value.lch()
			div.dataset.l = l;
			div.dataset.c = c;
			div.dataset.h = h;
		}
		div.style.setProperty('--color', color.value.css());
		div.style.setProperty('--color-lch', color.value.css('lch'));
		div.title = color.value.css();
		if (color.value.lch()[0] > 50) {
			div.classList.add('bright');
			div.classList.remove('dark');
		} else {
			div.classList.add('dark');
			div.classList.remove('bright');
		}
	}

	onRemovePoint(retiredPoint) {
		for (const [point, colorDiv] of this._points) {
			if (point === retiredPoint) {
				colorDiv.remove();
			}
		}
	}

	/**
	 * @param {ColorSelectionManager} selection
	 */
	set colorSelectionManager(selection) {
		this._selection = selection;
		this._points.forEach(([, , rmFn]) => rmFn());
		this._points.splice(0, this._points.length);

		const onAddPoint = point => this.onAddPoint(point);
		const onRemovePoint = point => this.onRemovePoint(point);
		const onReferenceValueChange = () => this._onReferenceValueChange();

		selection.addPointAddListener(onAddPoint);
		selection.addPointRemoveListener(onRemovePoint);
		selection.reference.addChangeListener(onReferenceValueChange);
		for (const point of selection.points) {
			onAddPoint(point);
		}
		const l = this._selectionChangeListeners;
		for (const f of l) {
			f();
		}
		const onSelectionChangeListener = () => {
			selection.removePointAddListener(onAddPoint);
			selection.removePointRemoveListener(onRemovePoint);
			selection.reference.removeChangeListener(onReferenceValueChange);
			this._selectionChangeListeners = this._selectionChangeListeners.filter(f => f !== onSelectionChangeListener);
		};
		this._selectionChangeListeners.push(onSelectionChangeListener);
		this._onReferenceValueChange();
	}

	get colorSelectionManager() {
		return this._selection;
	}

	_onReferenceValueChange() {
		this._updateColor(this._selection.reference, this._referenceEl);
	}
}
