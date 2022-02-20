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

import LchPlaneColorPicker from "../LchPlaneColorPicker.js";
import LchColor from "../../LchColor.js";

export default class LchLuminosityColorPicker extends LchPlaneColorPicker {
	_pickColor(x, y) {
		return new LchColor(this._selection.reference.value.lch()[0], this.xToChroma(y), this.xToHue(x));
	}

	_pickBarColor(x) {
		const [l, c, h] = this._selection.contemplation.value.lch();
		return new LchColor(this.xToLuminosity(x), c, h);
	}

	_locateBarColor(color) {
		const [l, c, h] = color.lch();
		return this.luminosityToX(l);
	}

	_locateColor(color) {
		const [l, c, h] = color.lch();
		return [
			this.hueToX(h),
			this.chromaToX(c),
		];
	}

	_containsColor(color) {
		const [l, c, h] = color.lch();
		return Math.abs(this._selection.reference.value.lch()[0] - l) < 0.01;
	}

	get type() {
		return 'luminosity';
	}
}
