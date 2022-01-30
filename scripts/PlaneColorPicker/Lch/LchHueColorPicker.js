import LchPlaneColorPicker from "../LchPlaneColorPicker.js";
import LchColor from "../../LchColor.js";

export default class LchHueColorPicker extends LchPlaneColorPicker {
	_pickColor(x, y) {
		return new LchColor(x * 100, (y - 0.5) * 250, this._selection.reference.value.lch()[2]);
	}

	_pickBarColor(x) {
		const [l, c, h] = this._selection.contemplation.value.lch();
		return new LchColor(l, c, x * 360);
	}

	_locateBarColor(color) {
		const [l, c, h] = color.lch();
		return h / 360;
	}

	_locateColor(color) {
		const [l, c, h] = color.lch();
		return [
			l / 100,
			c / 250 + 0.5,
		];
	}

	_containsColor(color) {
		const [l, c, h] = color.lch();
		return Math.abs(this._selection.reference.value.lch()[2] - h) < 0.01;
	}
}
