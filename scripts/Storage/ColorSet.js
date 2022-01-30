import ColorSelectionManager from "../ColorSelectionManager.js";

export default class ColorSet {
	/**
	 * @type {string}
	 */
	_name;
	/**
	 * @type {ColorSelectionManager}
	 */
	_colorManager;
	_nameChangeListeners = [];

	static fromObject(object) {
		const colorManager = ColorSelectionManager.fromObject(object['colorSelection']);
		const name = object['name'];

		return new ColorSet(name, colorManager);
	}

	constructor(name, colorManager) {
		this._name = name;
		this._colorManager = colorManager;
	}

	get colorSelectionManager() {
		return this._colorManager;
	}

	get name() {
		return this._name;
	}

	set name(newName) {
		this._name = newName;
		for (const f of this._nameChangeListeners) {
			f(newName);
		}
	}

	addNameChangeListener(f) {
		this._nameChangeListeners.push(f);
	}

	toObject() {
		return {
			'name': this._name,
			'colorSelection': this._colorManager.toObject(),
		}
	}

	copy() {
		return ColorSet.fromObject(this.toObject());
	}
}
