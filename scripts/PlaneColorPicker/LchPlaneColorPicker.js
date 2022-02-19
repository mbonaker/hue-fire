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
