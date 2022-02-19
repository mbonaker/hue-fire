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
