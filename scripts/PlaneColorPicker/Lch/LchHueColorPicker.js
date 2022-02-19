import LchPlaneColorPicker from "../LchPlaneColorPicker.js";
import LchColor from "../../LchColor.js";

export default class LchHueColorPicker extends LchPlaneColorPicker {
	_pickColor(x, y) {
		return new LchColor(this.xToLuminosity(x), this.xToChroma(y), this._selection.reference.value.lch()[2]);
	}

	_pickBarColor(x) {
		const [l, c, h] = this._selection.contemplation.value.lch();
		return new LchColor(l, c, this.xToHue(x));
	}

	_locateBarColor(color) {
		const [l, c, h] = color.lch();
		return this.hueToX(h);
	}

	_locateColor(color) {
		const [l, c, h] = color.lch();
		return [
			this.luminosityToX(l),
			this.chromaToX(c),
		];
	}

	_containsColor(color) {
		const [l, c, h] = color.lch();
		return Math.abs(this._selection.reference.value.lch()[2] - h) < 0.01;
	}

	get type() {
		return 'hue';
	}
}
