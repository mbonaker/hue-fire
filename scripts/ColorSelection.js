export default class ColorSelection {
	_value;
	/**
	 * @type {string}
	 */
	_name;
	_changeListeners = [];

	/**
	 * @param {string} name
	 * @param {LchColor} value
	 */
	constructor(name, value = null) {
		this._name = name;
		this._value = value;
	}

	/**
	 * @returns {chroma.Color}
	 */
	get value() {
		return this._value;
	}
	set value(value) {
		this._value = value;
		for (const f of this._changeListeners) {
			f(value);
		}
	}
	addChangeListener(f) {
		this._changeListeners.push(f);
	}
	removeChangeListener(f) {
		this._changeListeners = this._changeListeners.filter(o => o !== f);
	}


	get name() {
		return this._name;
	}
}
