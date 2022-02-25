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

export default class ColorSetCollectionButton {
	_e;
	_colorSet;
	_loadListeners = [];
	_unloadListeners = [];
	_saveListeners = [];
	_copyListeners = [];
	_renameListeners = [];
	_removeListeners = [];

	constructor(colorSet) {
		this._colorSet = colorSet;

		const div = document.createElement('div');
		this._e = div;

		div.classList.add('color-set');
		const contextMenu = document.createElement('div');
		contextMenu.classList.add('context-menu');
		const loadButton = document.createElement('button');
		const saveButton = document.createElement('button');
		const renameButton = document.createElement('button');
		const removeButton = document.createElement('button');
		const copyButton = document.createElement('button');
		loadButton.textContent = 'Load';
		saveButton.textContent = 'Save';
		renameButton.textContent = 'Rename';
		removeButton.textContent = 'Remove';
		copyButton.textContent = 'Copy as JSON';
		contextMenu.append(
			loadButton,
			saveButton,
			renameButton,
			removeButton,
			copyButton,
		);

		div.textContent = colorSet.name;
		colorSet.addNameChangeListener(newName => {
			div.textContent = newName;
		});

		loadButton.addEventListener('click', e => {
			e.preventDefault();
			this.load();
		});
		saveButton.addEventListener('click', e => {
			e.preventDefault();
			this.save();
		});
		renameButton.addEventListener('click', e => {
			e.preventDefault();
			this.rename();
		});
		removeButton.addEventListener('click', e => {
			e.preventDefault();
			this.remove();
		});
		copyButton.addEventListener('click', e => {
			e.preventDefault();
			this.copy();
		});

		this.updateReferenceColor();
		div.append(contextMenu);
		div.tabIndex = 0;
		div.addEventListener('click', e => {
			e.preventDefault();
			div.focus();
			div.classList.toggle('show-context-menu');
		});
		div.addEventListener('blur', e => {
			if (!e.currentTarget.contains(e.relatedTarget)) {
				div.classList.remove('show-context-menu');
			}
		});
	}

	get htmlElement() {
		return this._e;
	}

	get colorSet() {
		return this._colorSet;
	}

	addLoadListener(f) {
		this._loadListeners.push(f);
	}

	addUnloadListener(f) {
		this._unloadListeners.push(f);
	}

	addSaveListener(f) {
		this._saveListeners.push(f);
	}

	addRenameListener(f) {
		this._renameListeners.push(f);
	}

	addRemoveListener(f) {
		this._removeListeners.push(f);
	}

	unload() {
		for (const f of this._unloadListeners) {
			f();
		}
		this._e.classList.remove('active');
		return this;
	}

	load() {
		for (const f of this._loadListeners) {
			f();
		}
		this._e.classList.add('active');
		return this;
	}

	save() {
		for (const f of this._saveListeners) {
			f();
		}
		this.updateReferenceColor();
		return this;
	}

	updateReferenceColor() {
		const color = this._colorSet.colorSelectionManager.reference.value;
		this._e.style.setProperty('--reference-color', color.hex());
		if (color.lch()[0] > 65) {
			this._e.classList.add('bright-reference-color');
			this._e.classList.remove('dark-reference-color');
		} else {
			this._e.classList.add('dark-reference-color');
			this._e.classList.remove('bright-reference-color');
		}
	}

	rename() {
		const newName = prompt(`New name for "${this._colorSet.name}":`);
		if (newName !== null) {
			this.colorSet.name = newName;
			for (const f of this._renameListeners) {
				f();
			}
		}
	}

	remove() {
		const ok = confirm(`Do you really want to delete "${this.colorSet.name}"?`);
		if (ok) {
			for (const f of this._removeListeners) {
				f();
			}
		}
	}

	copy() {
		navigator.clipboard.writeText(JSON.stringify(this._colorSet.toObject()));
		for (const f of this._copyListeners) {
			f();
		}
	}
}
