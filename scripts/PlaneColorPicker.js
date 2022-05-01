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

import ColorSelectionPoint from "./ColorSelectionPoint.js";
import LchColor from "./LchColor.js";

export default class PlaneColorPicker {
	/**
	 * @type {HTMLCanvasElement} _canvas
	 */
	_canvas;
	/**
	 * @type {HTMLCanvasElement} _canvas
	 */
	_canvasS;
	/**
	 * @type {HTMLCanvasElement} _barCanvas
	 * @protected
	 */
	_barCanvas;
	/**
	 * @type {HTMLCanvasElement} _barCanvas
	 * @protected
	 */
	_barCanvasS;
	/**
	 * @type {CanvasRenderingContext2D} _barContext
	 * @protected
	 */
	_barContext;
	/**
	 * @type {CanvasRenderingContext2D} _barContext
	 * @protected
	 */
	_barContextS;
	/**
	 * @type {ColorSelectionManager} _selection
	 * @protected
	 */
	_selection;
	/**
	 * @type {ResolutionManager} _resolutionManager
	 */
	_resolutionManager;
	/**
	 * @type {CanvasRenderingContext2D} _context
	 */
	_context;
	/**
	 * @type {CanvasRenderingContext2D} _context
	 */
	_contextS;
	/**
	 * @type {ImageData} _imageData
	 */
	_imageData;
	/**
	 * @type {ImageData} _barImageData
	 */
	_barImageData;
	_barHovered = false;
	_removeColorSelectionManagerListeners = null;
	_displayComplementaryColor = false;
	_renderable = false;
	/**
	 * @type {Int8Array} _validColorMask
	 */
	_validColorMask = null;
	/**
	 * @type {ImageData} _validColorOverlay
	 */
	_validColorOverlay = null;

	/**
	 * @param {Document} document
	 * @param {ResolutionManager} resolutionManager
	 * @param {ColorSelectionManager} selection
	 */
	constructor(document, resolutionManager, selection) {
		this._canvas = document.createElement("canvas");
		this._canvasS = document.createElement("canvas");
		this._context = this._canvas.getContext("2d");
		this._contextS = this._canvasS.getContext("2d");
		this._resolutionManager = resolutionManager;
		this.colorSelectionManager = selection;
		this._resolutionManager.addChangeListener(color => this.generatePlane().then(this.generateBar));
		requestAnimationFrame(() => this.generateBar());
		this._canvas.addEventListener('click', ev => {
			const elRect = this._canvas.getBoundingClientRect();
			const [rw, rh] = this._resolutionManager.getPlaneDisplayResolution();
			const x = (ev.clientX - elRect.left) / rw;
			const y = (ev.clientY - elRect.top) / rh;
			if (ev.altKey) {
				this._selection.reference.value = this._getColor(x, y);
			} else {
				const color = this._pickColor(x, y);
				const point = new ColorSelectionPoint(color);
				point.value = color;
				this._selection.addPoint(point);
				this._checkHover(x, y);
			}
		});
		this._canvas.addEventListener('mousemove', ev => {
			const elRect = this._canvas.getBoundingClientRect();
			const [rw, rh] = this._resolutionManager.getPlaneDisplayResolution();
			const x = (ev.clientX - elRect.left) / rw;
			const y = (ev.clientY - elRect.top) / rh;
			this._checkHover(x, y);
			this._selection.contemplation.value = this._getColor(x, y);
		});
		this._canvas.addEventListener('mouseleave', ev => {
			for (const point of this._selection.points) {
				point.hoverStop();
			}
			this._selection.contemplation.value = this._selection.reference.value;
		});
		this._barCanvas = document.createElement('canvas');
		this._barCanvasS = document.createElement('canvas');
		this._barContext = this._barCanvas.getContext('2d');
		this._barContextS = this._barCanvasS.getContext('2d');
		this._barCanvas.addEventListener('mousemove', ev => {
			const elRect = this._barCanvas.getBoundingClientRect();
			const [rw,] = this._resolutionManager.getPlaneDisplayResolution();
			const x = (ev.clientX - elRect.left) / rw;
			const y = (ev.clientY - elRect.top) / this._barCanvas.height;
			this._checkHoverBar(x, y);
			this._selection.contemplation.value = this._getBarColor(x, y);
		});
		this._barCanvas.addEventListener('mouseenter', ev => {
			this._barHovered = true;
		});
		this._barCanvas.addEventListener('mouseleave', ev => {
			for (const point of this._selection.points) {
				point.hoverStop();
			}
			this._selection.contemplation.value = this._selection.reference.value;
			this._barHovered = false;
		});
		this._barCanvas.addEventListener('click', ev => {
			const elRect = this._barCanvas.getBoundingClientRect();
			const [rw,] = this._resolutionManager.getPlaneDisplayResolution();
			const x = (ev.clientX - elRect.left) / rw;
			const y = (ev.clientY - elRect.top) / this._barCanvas.height;
			if (ev.altKey) {
				this._selection.reference.value = this._getBarColor(x, y);
			} else {
				const color = this._pickBarColor(x);
				const point = new ColorSelectionPoint(color);
				point.value = color;
				this._selection.addPoint(point);
				this._checkHoverBar(x, y);
			}
		});
	}

	set displayComplementaryColor(active) {
		this._displayComplementaryColor = active;
		this.generatePlane();
	}

	_checkHover(x, y) {
		const maxDistance = 0.03;
		let bestPoint = null;
		let bestDistance = maxDistance;
		const points = this._selection.points;
		for (const point of points) {
			const [pointX, pointY] = this._locateColor(point.value);
			const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
			if (distance < bestDistance) {
				bestPoint = point;
				bestDistance = distance;
			}
		}
		for (const point of points) {
			if (point === bestPoint) {
				point.hoverStart();
			} else {
				point.hoverStop();
			}
		}
	}

	_checkHoverBar(x, y) {
	}

	_getColor(x, y) {
		for (const point of this._selection.points) {
			if (point.isHovered) {
				return point.value;
			}
		}
		return this._pickColor(x, y);
	}

	_getBarColor(x, y) {
		return this._pickBarColor(x);
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @return {chroma.Color}
	 * @abstract
	 */
	_pickColor(x, y) {
		throw new Error('"_pickColor" was not implemented for this');
	}

	/**
	 * @param {number} x
	 * @return {chroma.Color}
	 * @abstract
	 */
	_pickBarColor(x) {
		throw new Error('"_pickBarColor" was not implemented for this');
	}

	/**
	 * @param {chroma.Color} color
	 * @return {[number, number]} x, y
	 * @abstract
	 */
	_locateColor(color) {
		throw new Error('"_locateColor" was not implemented for this');
	}

	/**
	 * @param {chroma.Color} color
	 * @return {number} x
	 * @abstract
	 */
	_locateBarColor(color) {
		throw new Error('"_locateBarColor" was not implemented for this');
	}

	/**
	 * @param {chroma.Color} color
	 * @return {boolean} x
	 * @abstract
	 */
	_containsColor(color) {
		throw new Error('"_containsColor" was not implemented for this');
	}

	get context() {
		return this._context;
	}

	get canvas() {
		return this._canvas;
	}

	get barCanvas() {
		return this._barCanvas;
	}

	generatePlane() {
		if (!this._renderable) {
			return Promise.resolve();
		}
		const [sw, sh] = this._resolutionManager.getPlaneRenderResolution();
		this._canvasS.width = sw;
		this._canvasS.height = sh;
		const img = this._contextS.createImageData(sw, sh);
		const capMask = new Int8Array(sw * sh);
		for (let x = 0; x < img.width; x++) {
			for (let y = 0; y < img.height; y++) {
				let color = this._pickColor(x / img.width, y / img.height);
				img.data[y * 4 * img.width + x * 4] = color._rgb._unclipped[0];
				img.data[y * 4 * img.width + x * 4 + 1] = color._rgb._unclipped[1];
				img.data[y * 4 * img.width + x * 4 + 2] = color._rgb._unclipped[2];
				img.data[y * 4 * img.width + x * 4 + 3] = 255;
				capMask[y * img.width + x] = color.clipped() ? 1 : 0;
			}
		}
		let drawOverlay = false;
		const overlay = this._contextS.createImageData(sw, sh);
		overlay.data.set(img.data);
		for (let x = 0; x < img.width; x++) {
			for (let y = 0; y < img.height; y++) {
				const isBorder = !(x > 0 && x < img.width - 1 && y > 0 && y < img.height - 1);
				const isCapped = !!capMask[y * img.width + x];
				if (isBorder ^ isCapped) {
					drawOverlay = false;
					drawOverlay ||= (x + y) % 10 === 0;
					drawOverlay &&= (x % 10 > 5) === (y % 10 > 5);
					drawOverlay ||= isBorder;
					drawOverlay ||= !capMask[(y - 1) * img.width + x];
					drawOverlay ||= !capMask[(y + 1) * img.width + x];
					drawOverlay ||= !capMask[y * img.width + (x - 1)];
					drawOverlay ||= !capMask[y * img.width + (x + 1)];
					if (drawOverlay) {
						const [r, g, b] = [
							overlay.data[y * 4 * img.width + x * 4],
							overlay.data[y * 4 * img.width + x * 4 + 1],
							overlay.data[y * 4 * img.width + x * 4 + 2]
						];
						const lchColor = new LchColor(... chroma(r, g, b).lch());
						if (lchColor.l > 55) {
							overlay.data[y * 4 * img.width + x * 4] = 0;
							overlay.data[y * 4 * img.width + x * 4 + 1] = 0;
							overlay.data[y * 4 * img.width + x * 4 + 2] = 0;
						} else {
							overlay.data[y * 4 * img.width + x * 4] = 255;
							overlay.data[y * 4 * img.width + x * 4 + 1] = 255;
							overlay.data[y * 4 * img.width + x * 4 + 2] = 255;
						}
					}
				}
			}
		}
		// this._contextS.putImageData(img, 0, 0);
		this._contextS.putImageData(overlay, 0, 0);
		return this.drawPlane().then(() => this.generateBar());
	}

	drawPlane() {
		if (!this._renderable) {
			return Promise.resolve();
		}
		const [rw, rh] = this._resolutionManager.getPlaneDisplayResolution();
		this._canvas.width = rw;
		this._canvas.height = rh;
		this._context.scale(rw / this._canvasS.width, rh / this._canvasS.height);
		this._context.drawImage(this._canvasS, 0, 0);
		this._context.setTransform(1, 0, 0, 1, 0, 0);
		return this.drawPoints();
	}

	drawPoints() {
		if (!this._renderable) {
			return Promise.resolve();
		}
		for (const point of this._selection.points) {
			if (!point.isHovered) {
				this.renderNewPoint(point);
			}
		}
		for (const point of this._selection.points) {
			if (point.isHovered) {
				this.renderNewPoint(point);
			}
		}
		return Promise.resolve();
	}

	generateBar() {
		if (!this._renderable) {
			return Promise.resolve();
		}
		const [sw] = this._resolutionManager.getPlaneRenderResolution();
		this._barCanvasS.width = Math.round(sw);
		this._barCanvasS.height = 30;
		const img = this._barContextS.createImageData(this._barCanvasS.width, this._barCanvasS.height);
		const capMask = new Int8Array(this._barCanvasS.width);
		for (let x = 0; x < img.width; x++) {
			const color = this._pickBarColor(x / img.width);
			img.data[x * 4] = color._rgb._unclipped[0];
			img.data[x * 4 + 1] = color._rgb._unclipped[1];
			img.data[x * 4 + 2] = color._rgb._unclipped[2];
			img.data[x * 4 + 3] = 255;
			capMask[x] = color.clipped() ? 1 : 0;
		}
		for (let y = 0; y < img.height; y++) {
			img.data.copyWithin(img.width * y * 4, 0, img.width * 4);
		}
		const overlayedImg = this._barContextS.createImageData(this._barCanvasS.width, this._barCanvasS.height);
		overlayedImg.data.set(img.data);
		let drawOverlay = false;
		for (let x = 0; x < img.width; x++) {
			for (let y = 0; y < img.height; y++) {
				const isBorder = !(x > 0 && x < img.width - 1 && y > 0 && y < img.height - 1);
				const isCapped = !!capMask[x];
				if (isCapped ^ isBorder) {
					drawOverlay = false;
					drawOverlay ||= (x + y) % 10 === 0;
					drawOverlay &&= (x % 10 > 5) === (y % 10 > 5);
					drawOverlay ||= isBorder;
					drawOverlay ||= !capMask[x + 1];
					drawOverlay ||= !capMask[x - 1];
					if (drawOverlay) {
						const [r, g, b] = [
							overlayedImg.data[y * 4 * img.width + x * 4],
							overlayedImg.data[y * 4 * img.width + x * 4 + 1],
							overlayedImg.data[y * 4 * img.width + x * 4 + 2]
						];
						const lchColor = new LchColor(... chroma(r, g, b).lch());
						if (lchColor.l > 55) {
							overlayedImg.data[y * 4 * img.width + x * 4] = 0;
							overlayedImg.data[y * 4 * img.width + x * 4 + 1] = 0;
							overlayedImg.data[y * 4 * img.width + x * 4 + 2] = 0;
						} else {
							overlayedImg.data[y * 4 * img.width + x * 4] = 255;
							overlayedImg.data[y * 4 * img.width + x * 4 + 1] = 255;
							overlayedImg.data[y * 4 * img.width + x * 4 + 2] = 255;
						}
					}
				}
			}
		}
		this._barContextS.putImageData(overlayedImg, 0, 0);

		return this.drawBar();
	}

	drawBar() {
		if (!this._renderable) {
			return Promise.resolve();
		}
		const [rw] = this._resolutionManager.getPlaneDisplayResolution();
		this._barCanvas.width = rw;
		this._barCanvas.height = this._barCanvasS.height;

		this._barContext.scale(rw / this._barCanvasS.width, 1);
		this._barContext.drawImage(this._barCanvasS, 0, 0);
		this._barContext.setTransform(1, 0, 0, 1, 0, 0);


		const x = this._locateBarColor(this._barHovered ? this._selection.reference.value : this._selection.contemplation.value);
		this._barContext.beginPath();
		this._barContext.moveTo(x * rw, 0);
		this._barContext.lineTo(x * rw, 30);
		this._barContext.strokeStyle = '#000000';
		this._barContext.stroke();
		this._barContext.moveTo(x * rw + 1, 0);
		this._barContext.lineTo(x * rw + 1, 30);
		this._barContext.strokeStyle = '#ffffff';
		this._barContext.stroke();

		return Promise.resolve();
	}

	changeContemplatingColor(color) {
		requestAnimationFrame(() => this.generateBar())
	}

	/**
	 * @param {ColorSelectionPoint} selection
	 */
	renderNewPoint(selection) {
		const color = selection.value;
		const [w, h] = selection.isHovered ? [20, 20] : [8, 8];
		const [rw, rh] = this._resolutionManager.getPlaneDisplayResolution();
		const [x, y] = this._locateColor(color);
		if (this._containsColor(color)) {
			this._context.beginPath();
			this._context.rect(x * rw - (w - 1) / 2 - 1, y * rh - (h - 1) / 2 - 1, w + 2, h + 2);
			this._context.lineWidth = 1;
			this._context.strokeStyle = '#000000';
			this._context.stroke();
			this._context.beginPath();
			this._context.rect(x * rw - (w - 1) / 2, y * rh - (h - 1) / 2, w, h);
			this._context.strokeStyle = '#ffffff';
			this._context.stroke();
			this._context.fillStyle = color.hex();
			this._context.fill();
		} else {
			this._context.beginPath();
			this._context.moveTo(x * rw - (w - 1) / 2, y * rh - (h - 1) / 2);
			this._context.lineTo(x * rw + (w + 1) / 2, y * rh + (h + 1) / 2);
			this._context.moveTo(x * rw - (w - 1) / 2, y * rh + (h + 1) / 2);
			this._context.lineTo(x * rw + (w + 1) / 2, y * rh - (h - 1) / 2);
			this._context.strokeStyle = '#ffffff';
			this._context.stroke();
			this._context.beginPath();
			this._context.moveTo(x * rw - (w - 1) / 2 + 1, y * rh - (h - 1) / 2);
			this._context.lineTo(x * rw + (w + 1) / 2 + 1, y * rh + (h + 1) / 2);
			this._context.moveTo(x * rw - (w - 1) / 2 + 1, y * rh + (h + 1) / 2);
			this._context.lineTo(x * rw + (w + 1) / 2 + 1, y * rh - (h - 1) / 2);
			this._context.strokeStyle = '#000000';
			this._context.stroke();
		}
	}

	set colorSelectionManager(newColorSelectionManager) {
		if (this._removeColorSelectionManagerListeners) {
			this._removeColorSelectionManagerListeners();
			this._removeColorSelectionManagerListeners = null;
		}
		this._selection = newColorSelectionManager;
		const drawPlane = _ => this.drawPlane();

		for (const point of newColorSelectionManager.points) {
			point.addHoverListener(drawPlane);
		}
		const onAddPoint = newColor => {
			newColor.addHoverListener(drawPlane);
			this.renderNewPoint(newColor);
		};
		const onRemovePoint = newColor => {
			newColor.removeHoverListener(drawPlane);
			this.drawPlane();
		};
		this._selection.addPointAddListener(onAddPoint);
		this._selection.addPointRemoveListener(onRemovePoint);

		const onReferenceChange = color => this.generatePlane();
		const onContemplationChange = color => this.changeContemplatingColor(color);
		this._selection.reference.addChangeListener(onReferenceChange);
		this._selection.contemplation.addChangeListener(onContemplationChange);
		this._removeColorSelectionManagerListeners = () => {
			newColorSelectionManager.removePointAddListener(onAddPoint);
			newColorSelectionManager.removePointRemoveListener(onRemovePoint);
			newColorSelectionManager.reference.removeChangeListener(onReferenceChange);
			newColorSelectionManager.contemplation.removeChangeListener(onContemplationChange);
			for (const point of newColorSelectionManager.points) {
				point.removeHoverListener(drawPlane);
			}
		};
		this.generatePlane();
	}

	get type() {
		throw "Not implemented";
	}

	initPlane() {
		this._renderable = true;
		this.generatePlane();
	}
}
