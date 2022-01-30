import LchPlaneColorPicker from "../LchPlaneColorPicker.js";
import LchColor from "../../LchColor.js";

export default class LchLuminosityColorPicker extends LchPlaneColorPicker {
	_pickColor(x, y) {
		return new LchColor(this._selection.reference.value.lch()[0], (y - 0.5) * 260, x * 360);
	}

	_pickBarColor(x) {
		const [l, c, h] = this._selection.contemplation.value.lch();
		return new LchColor(x * 200 - 50, c, h);
	}

	_locateBarColor(color) {
		const [l, c, h] = color.lch();
		return (l + 50) / 200;
	}

	_locateColor(color) {
		const [l, c, h] = color.lch();
		return [
			h / 360,
			c / 260 + 0.5,
		];
	}

	_containsColor(color) {
		const [l, c, h] = color.lch();
		return Math.abs(this._selection.reference.value.lch()[0] - l) < 0.01;
	}
}
