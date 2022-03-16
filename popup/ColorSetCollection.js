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

import ColorSetCollectionButton from "./ColorSetCollectionButton.js";
import ColorSetUi from "./ColorSetUi.js";
import ColorSet from "../scripts/Storage/ColorSet.js";
import ColorSelectionManager from "../scripts/ColorSelectionManager.js";
import LchColor from "../scripts/LchColor.js";

export default class ColorSetCollection {
	/** @type {HTMLDivElement} */
	_e;
	/** @type {ColorSelectionManager} */
	_activeColorSelection;
	_activeColorSelectionChangeListeners = [];
	_colorSetAddListeners = [];
	/** @type {ColorSet[]} */
	_colorSets = [];
	_colorSetItemElements = new Map();
	_save;

	constructor(element, saveFn) {
		this._e = element;
		this._save = saveFn;
	}

	init(colorSets) {
		for (const colorSet of colorSets) {
			this.addColorSet(colorSet);
		}
		this._e.querySelector('.close').addEventListener('click', event => {
			event.preventDefault();
			this.close();
		});
		this._e.querySelector('.headline .new').addEventListener('click', e => {
			e.preventDefault();
			const newSetString = prompt('Paste palette JSON (beginning with "{") or just type the name of a new empty palette.');
			let colorSet;
			if (newSetString === null) {
				return;
			} else if (newSetString.startsWith('{')) {
				colorSet = ColorSet.fromObject(JSON.parse(newSetString));
			} else {
				colorSet = new ColorSet(newSetString, new ColorSelectionManager());
				colorSet.colorSelectionManager.reference.value = new LchColor(0, 0, 0);
			}
			this.addColorSet(colorSet);
			this._save();
		});
	}

	close() {
		this._e.dataset.state = 'closed';
	}

	/**
	 * @param {ColorSet} colorSet
	 */
	addColorSet(colorSet) {
		const list = document.createElement('div');
		list.classList.add('color-list');
		const header = document.createElement('input');
		header.type = 'text';
		header.value = colorSet.name;
		header.classList.add('color-set-name');
		header.addEventListener('change', ev => {
			colorSet.name = header.value;
			this._save();
		});
		const dragger = document.createElement('div');
		dragger.classList.add('dragger');
		const actionsContainer = document.createElement('div');
		actionsContainer.classList.add('actions-container');
		const loadButton = document.createElement('button');
		loadButton.classList.add('load-button');
		loadButton.textContent = 'Load';
		loadButton.addEventListener('click', ev => {
			this.activeColorSelection = colorSet.colorSelectionManager;
			this.close();
		});
		const deleteButton = document.createElement('button');
		deleteButton.classList.add('delete-button');
		deleteButton.textContent = 'Delete';
		deleteButton.addEventListener('click', ev => {
			ev.preventDefault();
			if (confirm(`Removing ${colorSet.name}... This is your last chance to cancel!`))
				this.removeColorSet(colorSet);
		});
		const copyButton = document.createElement('button');
		copyButton.classList.add('copy-button');
		copyButton.textContent = 'Copy JSON';
		copyButton.addEventListener('click', ev => {
			ev.preventDefault();
			navigator.clipboard.writeText(JSON.stringify(colorSet.toObject()));
		});
		const item = document.createElement('div');
		item.classList.add('color-set-selector-item');
		actionsContainer.append(deleteButton, loadButton, copyButton);
		item.append(dragger, list, header, actionsContainer);
		this._e.append(item);
		const ui = new ColorSetUi(list, document.getElementById('color-item-template'), colorSet.colorSelectionManager, () => {}, () => {});
		ui.colorSelectionManager = colorSet.colorSelectionManager;

		this._colorSets.push(colorSet);
		this._colorSetItemElements.set(colorSet, item);

		for (const f of this._colorSetAddListeners) {
			f(colorSet);
		}
	}

	addColorSetAddListener(f) {
		this._colorSetAddListeners.push(f);
	}

	saveCurrent() {
		this._save();
	}

	set activeColorSelection(colorSelection) {
		this._activeColorSelection = colorSelection;
		for (const f of this._activeColorSelectionChangeListeners) {
			f(colorSelection);
		}
	}

	get colorSets() {
		return [... this._colorSets];
	}

	get selectionIndex() {
		for (let i = 0; i < this._colorSets.length; i++) {
			if (this._activeColorSelection === this._colorSets[i].colorSelectionManager) {
				return i;
			}
		}
		throw "No color set selected!";
	}

	/**
	 * @param {ColorSet} colorSet
	 */
	removeColorSet(colorSet) {
		this._colorSetItemElements.get(colorSet).remove();
		this._colorSets = this._colorSets.filter(x => x.colorSelectionManager !== colorSet.colorSelectionManager);
		this._colorSetItemElements.delete(colorSet);
		this._save();
	}

	addActiveColorSelectionChangeListener(f) {
		this._activeColorSelectionChangeListeners.push(f);
	}

	open() {
		this._e.dataset.state = 'open';
	}
}
