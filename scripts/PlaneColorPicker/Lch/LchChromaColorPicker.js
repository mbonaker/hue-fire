import LchPlaneColorPicker from "../LchPlaneColorPicker.js";
import LchColor from "../../LchColor.js";

export default class LchChromaColorPicker extends LchPlaneColorPicker {
	_pickColor(x, y) {
		return new LchColor(this.xToLuminosity(y), this._selection.reference.value.lch()[1], this.xToHue(x));
	}

	_pickBarColor(x) {
		const [l, c, h] = this._selection.contemplation.value.lch();
		return new LchColor(l, this.xToChroma(x), h);
	}

	_locateBarColor(color) {
		const [l, c, h] = color.lch();
		return this.chromaToX(c);
	}

	_locateColor(color) {
		const [l, c, h] = color.lch();
		return [
			this.hueToX(h),
			this.luminosityToX(l),
		];
	}

	_containsColor(color) {
		const [l, c, h] = color.lch();
		return Math.abs(this._selection.reference.value.lch()[1] - c) < 0.01;
	}

	get type() {
		return 'chroma';
	}
}
