import LchColor from "../scripts/LchColor.js";

export default class PipetteUi {
	area;
	zoomCenterX = 0.5;
	zoomCenterY = 0.5;
	zoomMagnitude = 1;
	previewEl;

	constructor(area, addColor) {
		this.area = area;
		this.canvas = area.querySelector('canvas');
		this.context = this.canvas.getContext('2d');
		this.image = new Image();
		this.area.querySelector('.close').addEventListener('click', event => {
			event.preventDefault();
			this.close();
		});
		this.canvas.addEventListener('wheel', ev => {
			const zoomChange = 1 / (1 + ev.deltaY / 100 * 0.1);
			const [tx, ty] = this.fractionsToScreenCoords(
				(ev.clientX - this.canvas.getBoundingClientRect().x) / this.canvas.width,
				(ev.clientY - this.canvas.getBoundingClientRect().y) / this.canvas.height
			);
			this.zoomCenterX += (tx / this.image.width - this.zoomCenterX) * (1 - 1 / zoomChange);
			this.zoomCenterY += (ty / this.image.height - this.zoomCenterY) * (1 - 1 / zoomChange);
			this.zoomMagnitude *= zoomChange;
			this.drawScreenshot();
		});
		this.enableDragging();
		this.canvas.addEventListener('mousemove', ev => {
			const [x, y] = [
				ev.clientX - this.canvas.getBoundingClientRect().x,
				ev.clientY - this.canvas.getBoundingClientRect().y
			];
			const d = this.context.getImageData(x, y, 1, 1).data;
			const [l, c, h] = chroma(`rgb(${d[0]}, ${d[1]}, ${d[2]})`).lch()
			const color = new LchColor(l, c, h);
			this.previewEl.style.setProperty('--color', color.css('hsl'));
		});
		this.canvas.addEventListener('click', ev => {
			ev.preventDefault();
			const [x, y] = [
				ev.clientX - this.canvas.getBoundingClientRect().x,
				ev.clientY - this.canvas.getBoundingClientRect().y
			];
			const d = this.context.getImageData(x, y, 1, 1).data;
			const [l, c, h] = chroma(`rgb(${d[0]}, ${d[1]}, ${d[2]})`).lch()
			const color = new LchColor(l, c, h);
			this.close();
			addColor(color);
		});
		this.previewEl = area.querySelector('.color-preview');
	}

	enableDragging() {
		let isDragging = false;
		let ox, oy;
		this.canvas.addEventListener('mousedown', ev => {
			if (ev.which === 3) {
				ev.preventDefault();
				isDragging = true;
				ox = ev.clientX;
				oy = ev.clientY;
				this.canvas.classList.add('grabbing');
			}
		});
		this.canvas.addEventListener('contextmenu', ev => {
			ev.preventDefault();
		});
		this.canvas.addEventListener('mouseup', ev => {
			if (ev.which === 3) {
				ev.preventDefault();
				isDragging = false;
				this.canvas.classList.remove('grabbing');
			}
		});
		this.canvas.addEventListener('click', ev => {
			isDragging = false;
			this.canvas.classList.remove('grabbing');
		});
		this.canvas.addEventListener('mousemove', ev => {
			if (isDragging) {
				const [nx, ny] = [ev.clientX, ev.clientY];
				const [dx, dy] = [(nx - ox) / this.image.width, (ny - oy) / this.image.height];
				const z = this._getZoom();

				this.zoomCenterX -= dx / z;
				this.zoomCenterY -= dy / z;
				ox = nx;
				oy = ny;
				this.drawScreenshot();
			}
		});
	}

	open() {
		this.area.dataset.state = "open";
		this.canvas.width = this.canvas.parentElement.getBoundingClientRect().width;
		this.canvas.height = this.canvas.parentElement.getBoundingClientRect().height - this.canvas.parentElement.querySelector('.headline').getBoundingClientRect().height;
		this.zoomMagnitude = 1;
		this.zoomCenterX = 0.5;
		this.zoomCenterY = 0.5;
	}

	takeScreenshot() {
		chrome.tabs.captureVisibleTab(void 0, {
			format: 'png'
		}, data => {
			this.image.src = data;
			this.image.addEventListener('load', () => {
				this.drawScreenshot();
			});
		});
	}

	close() {
		this.area.dataset.state = 'closed';
	}

	_getZoom() {
		const [ow, oh] = [this.image.width, this.image.height];
		const [mw, mh] = [this.canvas.width, this.canvas.height];
		let baseZoom;

		if (mw / mh < ow / oh) {
			// width is limiting
			baseZoom = mw / ow;
		} else {
			// height is limiting
			baseZoom = mh / oh;
		}
		return baseZoom * this.zoomMagnitude;
	}

	fractionsToScreenCoords(x, y) {
		const zoom = this._getZoom();
		const newX = (x * this.canvas.width - this.canvas.width / 2) / zoom + this.zoomCenterX * this.image.width;
		const newY = (y * this.canvas.height - this.canvas.height / 2) / zoom + this.zoomCenterY * this.image.height;
		return [newX, newY];
	}

	drawScreenshot() {
		const zoom = this._getZoom();

		let mw = this.canvas.width;
		let mh = this.canvas.height;
		const [sw, sh] = [mw / zoom, mh / zoom]
		const [sx, sy] = this.fractionsToScreenCoords(0, 0);

		this.context.clearRect(0, 0, mw, mh);
		this.context.imageSmoothingEnabled = false;
		this.context.drawImage(this.image, sx, sy, sw, sh, 0, 0, mw, mh);
	}
}
