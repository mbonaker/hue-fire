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

import ColorSelectionManager from "../ColorSelectionManager.js";

export default class ColorSet {
	/**
	 * @type {string}
	 */
	_name;
	/**
	 * @type {ColorSelectionManager}
	 */
	_colorManager;
	_nameChangeListeners = [];

	static fromObject(object) {
		const colorManager = ColorSelectionManager.fromObject(object['colorSelection']);
		const name = object['name'];

		return new ColorSet(name, colorManager);
	}

	constructor(name, colorManager) {
		this._name = name;
		this._colorManager = colorManager;
	}

	get colorSelectionManager() {
		return this._colorManager;
	}

	get name() {
		return this._name;
	}

	set name(newName) {
		this._name = newName;
		for (const f of this._nameChangeListeners) {
			f(newName);
		}
	}

	addNameChangeListener(f) {
		this._nameChangeListeners.push(f);
	}

	toObject() {
		return {
			'name': this._name,
			'colorSelection': this._colorManager.toObject(),
		}
	}

	copy() {
		return ColorSet.fromObject(this.toObject());
	}
}
