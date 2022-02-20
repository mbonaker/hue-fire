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

export default class ResolutionManager {
	_sw = 50;
	_sh = 50;

	_rw = 246;
	_rh = 246;

	_resolutionChangeListeners = [];

	getPlaneRenderResolution() {
		return [this._sw, this._sh];
	}
	getPlaneDisplayResolution() {
		return [this._rw, this._rh];
	}

	increaseRenderResolution() {
		this._sw = Math.min(this._rw, this._sw * 2);
		this._sh = Math.min(this._rh, this._sh * 2);
		for (const f of this._resolutionChangeListeners) {
			f();
		}
	}

	decreaseRenderResolution() {
		this._sw = Math.max(10, this._sw / 2);
		this._sh = Math.max(10, this._sh / 2);
		for (const f of this._resolutionChangeListeners) {
			f();
		}
	}

	addChangeListener(f) {
		this._resolutionChangeListeners.push(f);
	}

	/**
	 * @param {number} sw
	 * @param {number} sh
	 */
	setRenderResolution(sw, sh) {
		this._sw = sw;
		this._sh = sh;
		for (const f of this._resolutionChangeListeners) {
			f();
		}
	}
}
