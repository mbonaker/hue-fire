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

export default class ColorSetCollection {
	/** @type {HTMLDivElement} */
	_e;
	/** @type {ColorSelectionManager} */
	_activeColorSelection;
	_activeColorSelectionChangeListeners = [];
	_colorSets;
	_save;
	/** @type {ColorSetCollectionButton[]} */
	_colorSetButtons = [];
	/** @type {ColorSetCollectionButton} */
	_activeColorSetButton = null;

	constructor(element, saveFn) {
		this._e = element;
		this._colorSets = [];
		this._save = saveFn;
	}

	init(colorSets) {
		for (const colorSet of colorSets) {
			this.addColorSet(colorSet);
		}
	}

	/**
	 * @param {ColorSet} colorSet
	 */
	addColorSet(colorSet) {
		const button = new ColorSetCollectionButton(colorSet);
		button.addLoadListener(() => {
			this.activeColorSelection = colorSet.colorSelectionManager.copy();
			if (this._activeColorSetButton) {
				this._activeColorSetButton.unload()
			}
			this._activeColorSetButton = colorSet;
		});
		button.addSaveListener(() => {
			colorSet.colorSelectionManager.assimilate(this._activeColorSelection);
			this._save();
		});
		button.addRenameListener(() => {
			this._save();
		});
		button.addRemoveListener(() => {
			this.removeColorSet(button);
			this._save();
		});

		this._e.querySelector('.sets').append(button.htmlElement);

		this._colorSets.push(colorSet);
		this._colorSetButtons.push(button);
	}

	saveCurrent() {
		if (this._activeColorSetButton === null) {
			this.makeBaseSet().save();
		}
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

	/**
	 * @param {ColorSetCollectionButton} colorSetButton
	 */
	removeColorSet(colorSetButton) {
		colorSetButton.htmlElement.remove();
		this._colorSets = this._colorSets.filter(x => x !== colorSetButton.colorSet);
	}

	addActiveColorSelectionChangeListener(f) {
		this._activeColorSelectionChangeListeners.push(f);
	}

	makeBaseSet() {

	}
}
