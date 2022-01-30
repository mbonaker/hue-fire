import ColorSelectionPoint from "./ColorSelectionPoint.js";

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
	_removeColorSelectionManagerListeners = null;

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
		this._resolutionManager.addChangeListener(color => this.refreshPlane());
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
		this._barCanvas = document.createElement('canvas');
		this._barCanvasS = document.createElement('canvas');
		this._barContext = this._barCanvas.getContext('2d');
		this._barContextS = this._barCanvasS.getContext('2d');
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

	_getColor(x, y) {
		for (const point of this._selection.points) {
			if (point.isHovered) {
				return point.value;
			}
		}
		return this._pickColor(x, y);
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

	refreshPlane() {
		const [sw, sh] = this._resolutionManager.getPlaneRenderResolution();
		this._canvasS.width = sw;
		this._canvasS.height = sh;
		const img = this._contextS.createImageData(sw, sh);
		for (let x = 0; x < img.width; x++) {
			for (let y = 0; y < img.height; y++) {
				let color = this._pickColor(x / img.width, y / img.height);
				img.data[y * 4 * img.width + x * 4] = color._rgb._unclipped[0];
				img.data[y * 4 * img.width + x * 4 + 1] = color._rgb._unclipped[1];
				img.data[y * 4 * img.width + x * 4 + 2] = color._rgb._unclipped[2];
				img.data[y * 4 * img.width + x * 4 + 3] = color.clipped() ? 0 : 255;
			}
		}
		this._contextS.putImageData(img, 0, 0);
		return this.drawPlane();
	}

	drawPlane() {
		const [rw, rh] = this._resolutionManager.getPlaneDisplayResolution();
		this._canvas.width = rw;
		this._canvas.height = rh;
		this._context.scale(rw / this._canvasS.width, rh / this._canvasS.height);
		this._context.drawImage(this._canvasS, 0, 0);
		this._context.setTransform(1, 0, 0, 1, 0, 0);
		return this.drawPoints().then(() => this.generateBar());
	}

	drawPoints() {
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
		const [sw] = this._resolutionManager.getPlaneRenderResolution();
		this._barCanvasS.width = Math.round(sw);
		this._barCanvasS.height = 30;
		const img = this._barContextS.createImageData(this._barCanvasS.width, this._barCanvasS.height);
		for (let x = 0; x < img.width; x++) {
			const color = this._pickBarColor(x / img.width);
			img.data[x * 4] = color._rgb._unclipped[0];
			img.data[x * 4 + 1] = color._rgb._unclipped[1];
			img.data[x * 4 + 2] = color._rgb._unclipped[2];
			img.data[x * 4 + 3] = color.clipped() ? 0 : 255;
		}
		for (let y = 0; y < img.height; y++) {
			img.data.copyWithin(img.width * y * 4, 0, img.width * 4);
		}
		this._barContextS.putImageData(img, 0, 0);

		return this.drawBar();
	}

	drawBar() {
		const [rw] = this._resolutionManager.getPlaneDisplayResolution();
		this._barCanvas.width = rw;
		this._barCanvas.height = this._barCanvasS.height;

		this._barContext.scale(rw / this._barCanvasS.width, 1);
		this._barContext.drawImage(this._barCanvasS, 0, 0);
		this._barContext.setTransform(1, 0, 0, 1, 0, 0);


		const x = this._locateBarColor(this._selection.contemplation.value);
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

		const onReferenceChange = color => this.refreshPlane();
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
		this.refreshPlane();
	}
}
