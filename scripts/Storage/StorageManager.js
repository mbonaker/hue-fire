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

import ResolutionManager from "../ResolutionManager.js";
import ColorSet from "./ColorSet.js";

export default class StorageManager {
	_getStorage() {
		return chrome.storage.sync;
	}

	getColorSets() {
		return new Promise(resolve => {
			this._getStorage().get(['colorSets'], result => {
				if (typeof result['colorSets'] === 'undefined')
					return resolve([]);
				const objects = [];
				for (const colorSetObject of result['colorSets']) {
					objects.push(ColorSet.fromObject(colorSetObject));
				}
				resolve(objects);
			});
		});
	}

	/**
	 * @param {ColorSet[]} colorSets
	 * @returns {Promise}
	 */
	setColorSets(colorSets) {
		const colorSetObjects = [];
		for (const colorSet of colorSets) {
			colorSetObjects.push(colorSet.toObject());
		}
		return new Promise(resolve => {
			this._getStorage().set({
				'colorSets': colorSetObjects,
			}, resolve);
		});
	}

	getResolutionManager() {
		return new Promise(resolve => {
			this._getStorage().get(['resolutionManager'], result => {
				const resolutionManager = new ResolutionManager();
				if (typeof result['resolutionManager'] !== 'undefined') {
					const [sw, sh] = [result['resolutionManager']['sw'], result['resolutionManager']['sh']];
					resolutionManager.setRenderResolution(sw, sh);
				}
				resolve(resolutionManager);
			});
		});
	}

	/**
	 * @param {ResolutionManager} resolutionManager
	 */
	setResolutionManager(resolutionManager) {
		const [sw, sh] = resolutionManager.getPlaneRenderResolution();
		return new Promise(resolve => {
			this._getStorage().set({
				'resolutionManager': {
					'sw': sw,
					'sh': sh,
				}
			}, resolve);
		});
	}

	isDisplayComplementActive(type) {
		return new Promise(resolve => {
			this._getStorage().get(['isDisplayComplementActive'], result => {
				if (typeof result['isDisplayComplementActive'] !== 'undefined' && typeof result['isDisplayComplementActive'][type] !== 'undefined') {
					resolve(result['isDisplayComplementActive'][type]);
				} else {
					resolve(null);
				}
			});
		});
	}

	setDisplayComplementActive(type, isActive) {
		return new Promise(resolve => {
			this._getStorage().get(['isDisplayComplementActive'], result => {
				let object;
				if (typeof result['isDisplayComplementActive'] !== 'undefined') {
					object = result['isDisplayComplementActive'];
				} else {
					object = {};
				}
				object[type] = isActive;
				this._getStorage().set({
					'isDisplayComplementActive': object,
				}, resolve);
			});
		});
	}
}
