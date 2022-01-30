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
