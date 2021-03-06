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

import LchColor from "./LchColor.js";

export default class FractionColorPicker {
	_canvas;
	/** @type {CanvasRenderingContext2D} */
	_context;
	_canvasS;
	_contextS;
	_resolutionManager;
	_rw;
	_hoveredSpot = null;
	_zoom = 0.9;
	_nFractions = 0;
	_spots = null;
	_colorPickedListeners = [];
	_colorAltPickedListeners = [];

	constructor(document, resolutionManager, width) {
		this._canvas = document.createElement("canvas");
		this._context = this._canvas.getContext("2d");
		this._canvasS = document.createElement("canvas");
		this._contextS = this._canvasS.getContext("2d");
		this._resolutionManager = resolutionManager;
		this._resolutionManager.addChangeListener(() => {
			this.generate();
		});
		this._startColor = new LchColor(0, 0, 0);
		this._endColor = new LchColor(0, 0, 0);
		this._rw = width;
		this._canvas.addEventListener('mousemove', ev => {
			this._refreshHoveredSpot(... this._coordsFromPointerEvent(ev));
			this.draw();
		});
		this._canvas.addEventListener('mouseleave', ev => {
			this._hoveredSpot = null;
			this.draw();
		});
		this._canvas.addEventListener('wheel', ev => {
			this._zoom -= this._zoom * ev.deltaY / 100 * 0.1;
			this._refreshSpots();
			this._refreshHoveredSpot(... this._coordsFromPointerEvent(ev));
			this.generate();
		});
		this._canvas.addEventListener('click', ev => {
			const [xs, ys] = this._coordsFromPointerEvent(ev);
			const color = this._getColorFromHover(xs, ys);
			const listeners = ev.altKey ? this._colorAltPickedListeners : this._colorPickedListeners;
			for (const f of listeners) {
				f(color);
			}
		});
		this._refreshSpots();
	}

	get nFractions() {
		return this._nFractions;
	}

	set nFractions(n) {
		this._nFractions = n;
		this._refreshSpots();
		this._hoveredSpot = null;
		this.draw();
	}

	addColorPickedListener(f) {
		this._colorPickedListeners.push(f);
	}

	addColorAltPickedListener(f) {
		this._colorAltPickedListeners.push(f);
	}

	set width(newWidth) {
		this._rw = newWidth;
		this._canvas.width = newWidth;
		this.generate();
	}

	_coordsFromPointerEvent(event) {
		const elRect = this._canvas.getBoundingClientRect();
		const xs = this._xrToXs(event.clientX - elRect.left);
		const ys = this._xrToXs(event.clientY - elRect.top);
		return [xs, ys];
	}

	get startColor() {
		let [l, c, h] = this._startColor.lch();
		if (Math.abs(c) < 0.1) {
			h = this._endColor.lch()[2];
			return new LchColor(l, c, h);
		} else {
			return this._startColor;
		}
	}

	get endColor() {
		let [l, c, h] = this._endColor.lch();
		if (Math.abs(c) < 0.1) {
			h = this._startColor.lch()[2];
			return new LchColor(l, c, h);
		} else {
			return this._endColor;
		}
	}

	set startColor(color) {
		this._canvas.closest('.fraction-picker').classList.remove('unused');
		this._startColor = color;
		this._refreshSpots();
		this.generate();
	}

	set endColor(color) {
		this._canvas.closest('.fraction-picker').classList.remove('unused');
		this._endColor = color;
		this._refreshSpots();
		this.generate();
	}

	get canvas() {
		return this._canvas;
	}

	_refreshSpots() {
		// TODO implement
		const spots = [];
		spots.push({
			x: 0,
			color: this.startColor,
			origin: "parameter",
		});
		spots.push({
			x: 1,
			color: this.endColor,
			origin: "parameter",
		});
		for (let i = 0; i < 1000; i++) {
			const n = this._nFractions + 1;
			// "mids" marks the spot that is either in the middle or slightly left to the middle if odd number of spots
			const mids = 0.5 - (n % 2 === 1 ? 1 / n / 2 : 0);
			let xs;
			if (i % 2 === 0) {
				// Draw spot to the left first
				xs = mids - Math.ceil(i / 2) / n;
			} else {
				xs = mids + Math.ceil(i / 2) / n;
			}
			if (this._xsToXr(xs) > this._rw)
				break;
			if (Math.abs(xs) < 0.001 || Math.abs(xs - 1) < 0.001)
				continue;
			spots.push({
				x: xs,
				color: this._pickColor(xs),
				origin: "calculated",
			});
		}
		this._spots = spots;
		return spots;
	}

	_getColorFromHover(x, y) {
		if (this._hoveredSpot !== null)  {
			return this._spots[this._hoveredSpot].color;
		}
		return this._pickColor(x);
	}

	_getHueDelta(h0, h1) {
		const [h0l, h0m, h0h] = [h0 - 360, h0, h0 + 360];
		const [dl, dm, dh] = [h1 - h0l, h1 - h0m, h1 - h0h];
		const [al, am, ah] = [dl, dm, dh].map(Math.abs);
		if (al < am && al < ah) {
			return dl;
		}
		if (am < ah) {
			return dm;
		}
		return dh;
	}

	_pickColor(xs) {
		const [l0, c0, h0] = this.startColor.lch();
		const [l1, c1, h1] = this.endColor.lch();
		const [ld, cd, hd] = [l1 - l0, c1 - c0, this._getHueDelta(h0, h1)];
		const [lx, cx, hx] = [ld * xs + l0, cd * xs + c0, hd * xs + h0];
		let h = hx;
		if (h < 0) {
			h = 360 - (Math.abs(h) % 360);
		} else {
			h = h % 360;
		}
		return new LchColor(lx, cx, h);
	}

	_refreshHoveredSpot(xs, sy) {
		const xr = this._xsToXr(xs);
		this._hoveredSpot = null;
		let minDistance = 4;
		let i = 0;
		for (const spot of this._spots) {
			const spotXr = this._xsToXr(spot.x);
			if (Math.abs(xr - spotXr) < minDistance) {
				minDistance = Math.abs(xr - spotXr);
				this._hoveredSpot = i;
			}
			i++;
		}
	}

	generate() {
		const [sw] = this._resolutionManager.getPlaneRenderResolution();
		this._canvasS.width = Math.round(sw / 260 * this._rw);
		this._canvasS.height = 30;
		const img = this._contextS.createImageData(this._canvasS.width, this._canvasS.height);
		const capMask = new Int8Array(this._canvasS.width);
		for (let x = 0; x < img.width; x++) {
			const color = this._pickColor(this._xrToXs(x / img.width * this._rw));
			img.data[x * 4] = color._rgb._unclipped[0];
			img.data[x * 4 + 1] = color._rgb._unclipped[1];
			img.data[x * 4 + 2] = color._rgb._unclipped[2];
			img.data[x * 4 + 3] = 255;
			capMask[x] = color.clipped() ? 1 : 0;
		}
		for (let y = 0; y < img.height; y++) {
			img.data.copyWithin(img.width * y * 4, 0, img.width * 4);
		}
		const overlayedImg = this._contextS.createImageData(this._canvasS.width, this._canvasS.height);
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

		this._contextS.putImageData(overlayedImg, 0, 0);

		return this.draw();
	}

	draw() {
		const rw = this._rw;
		this._canvas.width = rw;
		this._canvas.height = this._canvasS.height;

		this._context.scale(rw / this._canvasS.width, 1);
		this._context.drawImage(this._canvasS, 0, 0);
		this._context.setTransform(1, 0, 0, 1, 0, 0);

		for (let spot of this._spots) {
			this._drawSpot(spot);
		}

		return Promise.resolve();
	}

	_xsToXr(x) {
		const z = this._zoom;
		return (x * z + (1 - z) / 2) * this._rw;
	}

	_xrToXs(xr) {
		const z = this._zoom;
		return (xr / this._rw - (1 - z) / 2) / z;
	}

	_yrToYs(yr) {
		return yr / this._canvas.height;
	}

	_ysToYr(ys) {
		return ys * this._canvas.height;
	}

	_crToCs(xr, yr) {
		return [this._xrToXs(xr), this._yrToYs(yr)];
	}

	_csToCr(xs, ys) {
		return [this._xsToXr(xs), this._ysToYr(ys)];
	}

	_drawSpot(spot) {
		const xr = this._xsToXr(spot.x);
		const yr = this._ysToYr(0.5);
		const w = this._spots[this._hoveredSpot] === spot ? 15 : 7;
		const h = this._spots[this._hoveredSpot] === spot ? 15 : 15;
		const y = 0.5;
		this._context.beginPath();
		if (spot.origin === 'parameter') {
			this._context.rect(xr - (w - 1) / 2 - 1, yr - (h - 1) / 2 - 1, w + 2, h + 2);
		} else if (spot.origin === 'calculated') {
			this._context.arc(xr, yr, w / 2, 0, 2 * Math.PI);
		}
		this._context.lineWidth = 1;
		this._context.strokeStyle = '#000000';
		this._context.stroke();
		this._context.beginPath();
		if (spot.origin === 'parameter') {
			this._context.rect(xr - (w - 1) / 2, yr - (h - 1) / 2, w, h);
		} else if (spot.origin === 'calculated') {
			this._context.arc(xr, yr, w / 2 - 1, 0, 2 * Math.PI);
		}
		this._context.strokeStyle = '#ffffff';
		this._context.stroke();
		this._context.fillStyle = spot.color.hex();
		this._context.fill();
	}
}
