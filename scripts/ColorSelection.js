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

export default class ColorSelection {
	_value;
	/**
	 * @type {string}
	 */
	_name;
	_changeListeners = [];

	/**
	 * @param {string} name
	 * @param {LchColor} value
	 */
	constructor(name, value = null) {
		this._name = name;
		this._value = value;
	}

	/**
	 * @returns {chroma.Color}
	 */
	get value() {
		return this._value;
	}
	set value(value) {
		this._value = value;
		for (const f of this._changeListeners) {
			f(value);
		}
	}
	addChangeListener(f) {
		this._changeListeners.push(f);
	}
	removeChangeListener(f) {
		this._changeListeners = this._changeListeners.filter(o => o !== f);
	}


	get name() {
		return this._name;
	}
}
