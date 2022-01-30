export default class LchColor extends chroma.Color {
	l;
	c;
	h;
	constructor(l, c, h) {
		super(l, c, h, 'lch');
		this.l = l;
		this.c = c;
		this.h = h;
	}
	lch() {
		return [this.l, this.c, this.h];
	}
	hcl() {
		return [this.h, this.c, this.l];
	}
	css(mode) {
		if (mode === 'hcl') {
			return `hcl(${this.h}, ${this.c}, ${this.l})`;
		} else if (mode === 'lch') {
			return `lch(${this.l}, ${this.c}, ${this.h})`;
		}
		return chroma.Color.prototype.css.call(this, mode);
	}
}