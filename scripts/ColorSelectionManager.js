/*!
 * Hue Fire
 * Copyright (C) 2022  Matteo Bonaker
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import ColorSelection from "./ColorSelection.js";
import LchColor from "./LchColor.js";
import ColorSelectionPoint from "./ColorSelectionPoint.js";

export default class ColorSelectionManager {
	/**
	 * @type {ColorSelection}
	 */
	_contemplation;
	/**
	 * @type {ColorSelection}
	 */
	_reference;

	_pointAddListeners = [];
	_pointRemoveListeners = [];

	/**
	 * @type {ColorSelectionPoint[]}
	 */
	_points;

	static fromObject(object) {
		const points = [];
		for (const pointObject of object['points']) {
			const [l, c, h] = [pointObject['color']['l'], pointObject['color']['c'], pointObject['color']['h']];
			const color = new LchColor(l, c, h);
			const point = new ColorSelectionPoint(color.hex());
			point.value = color;
			points.push(point);
		}
		const reference = new ColorSelection('.reference');
		{
			const referenceObject = object['reference'];
			const [l, c, h] = [referenceObject['color']['l'], referenceObject['color']['c'], referenceObject['color']['h']];
			reference.value = new LchColor(l, c, h);
		}
		const manager = new ColorSelectionManager();
		manager.reference.value = reference.value;
		manager._points = points;
		return manager;
	}

	constructor() {
		this._contemplation = new ColorSelection(".contemplation");
		this._reference = new ColorSelection(".reference");
		this._reference.addChangeListener(color => {
			this._contemplation.value = color;
		});
		this._points = [];
	}

	get reference() {
		return this._reference;
	}

	get contemplation() {
		return this._contemplation;
	}

	addPointAddListener(f) {
		this._pointAddListeners.push(f);
	}

	addPointRemoveListener(f) {
		this._pointRemoveListeners.push(f);
	}

	removePointAddListener(f) {
		this._pointAddListeners = this._pointAddListeners.filter(o => o !== f);
	}

	removePointRemoveListener(f) {
		this._pointRemoveListeners = this._pointRemoveListeners.filter(o => o !== f);
	}

	/**
	 * @param {ColorSelectionPoint} selection
	 */
	addPoint(selection) {
		this._points.push(selection);
		for (const f of this._pointAddListeners) {
			f(selection);
		}
	}

	removePoint(selection) {
		this._points = this._points.filter(x => x !== selection);
		for (const f of this._pointRemoveListeners) {
			f(selection);
		}
	}

	toObject() {
		const object = {};
		{ // set reference
			const [l, c, h] = this.reference.value.lch();
			object.reference = {
				'color': {
					'l': l,
					'c': c,
					'h': h,
				}
			}
		}
		object.points = [];
		for (const point of this._points) {
			const [l, c, h] = point.value.lch();
			const pointObject = {
				'color': {
					'l': l,
					'c': c,
					'h': h,
				}
			}
			object.points.push(pointObject);
		}
		return object;
	}

	get points() {
		return [... this._points];
	}

	set points(points) {
		if (this._pointAddListeners.length > 0 || this._pointRemoveListeners.length > 0) {
			throw new Error("Cannot currently set points on the color selection manager if it already has event listeners.");
		}
		this._points = [... points];
	}

	/**
	 * @param {ColorSelectionManager} colorSelectionManager
	 */
	assimilate(colorSelectionManager) {
		while (this._points.length > 0) {
			this.removePoint(this._points[this._points.length - 1]);
		}
		this.reference.value = colorSelectionManager.reference.value;
		for (const point of colorSelectionManager.points) {
			this.addPoint(new ColorSelectionPoint(point.name, point.value));
		}
	}

	copy() {
		return ColorSelectionManager.fromObject(this.toObject());
	}
}
