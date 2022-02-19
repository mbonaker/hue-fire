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
