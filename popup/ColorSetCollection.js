export default class ColorSetCollection {
	/** @type {HTMLDivElement} */
	_e;
	/** @type {ColorSelectionManager} */
	_activeColorSelection;
	_activeColorSelectionChangeListeners = [];
	_colorSets;
	_save;

	constructor(element, saveFn) {
		this._e = element;
		this._colorSets = [];
		this._save = saveFn;
	}

	init(colorSets) {
		for (const colorSet of colorSets) {
			this.addColorSet(colorSet);
		}
	}

	/**
	 * @param {ColorSet} colorSet
	 */
	addColorSet(colorSet) {
		const div = document.createElement('div');
		div.classList.add('color-set');
		const contextMenu = document.createElement('div');
		contextMenu.classList.add('context-menu');
		const loadButton = document.createElement('button');
		const saveButton = document.createElement('button');
		const renameButton = document.createElement('button');
		const removeButton = document.createElement('button');
		// const editCodeButton = document.createElement('button');
		loadButton.textContent = 'load';
		saveButton.textContent = 'save';
		renameButton.textContent = 'rename';
		removeButton.textContent = 'remove';
		// editCodeButton.textContent = 'edit';
		contextMenu.append(
			loadButton,
			saveButton,
			renameButton,
			removeButton
			// editCodeButton
		);

		div.textContent = colorSet.name;
		colorSet.addNameChangeListener(newName => {
			div.textContent = newName;
		});

		loadButton.addEventListener('click', e => {
			e.preventDefault();
			this.activeColorSelection = colorSet.colorSelectionManager.copy();
		});
		saveButton.addEventListener('click', e => {
			e.preventDefault();
			colorSet.colorSelectionManager.assimilate(this._activeColorSelection);
			this.setReferenceColor(div, colorSet.colorSelectionManager.reference.value);
			this._save();
		});
		renameButton.addEventListener('click', e => {
			e.preventDefault();
			const newName = prompt(`New name for "${colorSet.name}":`);
			if (newName !== null) {
				colorSet.name = newName;
				this._save();
			}
		});
		removeButton.addEventListener('click', e => {
			e.preventDefault();
			const ok = confirm(`Do you really want to delete "${colorSet.name}"?`);
			if (ok) {
				this.removeColorSet(colorSet, div);
				this._save();
			}
		});

		this.setReferenceColor(div, colorSet.colorSelectionManager.reference.value);
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
		this._e.querySelector('.sets').append(div);

		this._colorSets.push(colorSet);
	}

	setReferenceColor(div, color) {
		div.style.setProperty('--reference-color', color.hex());
		if (color.lch()[0] > 80) {
			div.classList.add('bright-reference-color');
			div.classList.remove('dark-reference-color');
		} else {
			div.classList.add('dark-reference-color');
			div.classList.remove('bright-reference-color');
		}
	}

	set activeColorSelection(colorSelection) {
		this._activeColorSelection = colorSelection;
		for (const f of this._activeColorSelectionChangeListeners) {
			f(colorSelection);
		}
	}

	get colorSets() {
		return [... this._colorSets];
	}

	removeColorSet(colorSet, div) {
		div.remove();
		this._colorSets = this._colorSets.filter(x => x !== colorSet);
	}

	addActiveColorSelectionChangeListener(f) {
		this._activeColorSelectionChangeListeners.push(f);
	}
}
