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

import PlaneColorPicker from "../PlaneColorPicker.js";

export default class LchPlaneColorPicker extends PlaneColorPicker {
	xToHue(x) {
		return x * 360;
	}
	hueToX(hue) {
		return hue / 360;
	}
	xToChroma(x) {
		if (this._displayComplementaryColor) {
			return (x - 0.5) * 250;
		} else {
			return x * 125;
		}
	}
	chromaToX(chroma) {
		if (this._displayComplementaryColor) {
			return chroma / 250 + 0.5;
		} else {
			return chroma / 125;
		}
	}
	xToLuminosity(x) {
		return x * 200 - 50;
	}
	luminosityToX(luminosity) {
		return (luminosity + 50) / 200;
	}
}
