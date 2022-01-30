import LchPlaneColorPicker from "../LchPlaneColorPicker.js";
import LchColor from "../../LchColor.js";

export default class LchChromaColorPicker extends LchPlaneColorPicker {
	_pickColor(x, y) {
		return new LchColor(y * 200 - 50, this._selection.reference.value.lch()[1], x * 360);
	}

	_pickBarColor(x) {
		const [l, c, h] = this._selection.contemplation.value.lch();
		return new LchColor(l, x * 120, h);
	}

	_locateBarColor(color) {
		const [l, c, h] = color.lch();
		return c / 120;
	}

	_locateColor(color) {
		const [l, c, h] = color.lch();
		return [
			h / 360,
			(l + 50) / 200,
		];
	}

	_containsColor(color) {
		const [l, c, h] = color.lch();
		return Math.abs(this._selection.reference.value.lch()[1] - c) < 0.01;
	}
}
