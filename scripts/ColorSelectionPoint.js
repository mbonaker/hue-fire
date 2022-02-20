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

import ColorSelection from "./ColorSelection.js";

export default class ColorSelectionPoint extends ColorSelection {
	_isHovered = false;

	_hoverListeners = [];

	hoverStart() {
		if (this._isHovered)
			return;
		this._isHovered = true;
		for (const f of this._hoverListeners) {
			f(true);
		}
	}

	hoverStop() {
		if (!this._isHovered)
			return;
		this._isHovered = false;
		for (const f of this._hoverListeners) {
			f(false);
		}
	}

	addHoverListener(f) {
		this._hoverListeners.push(f);
	}

	removeHoverListener(f) {
		this._hoverListeners = this._hoverListeners.filter(fl => fl !== f);
	}

	get isHovered() {
		return this._isHovered;
	}
}
