if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("sw.js")
}

let maxProtonNumber = elements[elements.length - 1][0]

let isTouch
window.addEventListener('touchstart', function _saveTouch() {
	isTouch = true
	window.removeEventListener('touchstart', _saveTouch)
})
window.addEventListener('click', function _wasTouched() {
	if (typeof isTouch === 'undefined') {
		isTouch = false
	}
	window.removeEventListener('click', _wasTouched)
})

function hideKeyboard() {
	if (isTouch && document.activeElement.tagName === 'INPUT') {
		document.activeElement.blur()
	}
}

function sortElements() {
	elements.sort((first, second) => first[1].localeCompare(second[1]))
}

sortElements()

const data = {
	inputNumber: '',
	protonNumber: 0,
	ion: 0,
	minIon: 0,
	maxIon: 0,
}

let vueParams = {
	el: '#app',
	computed: {
		orbitalsView: function () {
			return this.showExceptions ? this.orbitals : this.orbitalsNoEx
		},
		shortOrbitalsIndexesView: function () {
			return this.getShortOrbitals(this.orbitalsView)
		},
		controller: function () {
			return this.getController()
		},
		orbitals: function () {
			this.controller.checkExceptions()
			let ret = this.controller.element.orbitals.filter(orbital => orbital.electronNumber > 0)
			return this.ion > 0 ? removeElectrons(ret, this.ion) : ret
		},
		shortOrbitalsIndexes: function () {
			return this.getShortOrbitals(this.orbitals)
		},
		controllerNoEx: function () {
			return this.getController()
		},
		orbitalsNoEx: function () {
			let ret = this.controllerNoEx.element.orbitals.filter(orbital => orbital.electronNumber > 0)
			return this.ion > 0 ? removeElectrons(ret, this.ion) : ret
		},
		shortOrbitalsIndexesNoEx: function () {
			return this.getShortOrbitals(this.orbitalsNoEx)
		},
		configurationText: function () {
			if (this.showShort) {
				return this.textForIndexes(this.shortOrbitalsIndexesView, this.orbitalsView)
			} else {
				return this.textForIndexes(Object.keys(this.orbitalsView), this.orbitalsView)
			}
		}
	},
	methods: {
		getController: function () {
			let element = new Element(this.protonNumber - Math.min(0, this.ion))
			let controller = new Controller(element, exceptions)
			controller.initiate()
			return controller
		},
		getShortOrbitals: function (orbitals) {
			let lastNobleGas
			for (let i = nobleGases.length - 1; i >= 0; i--) {
				if (nobleGases[i] < this.protonNumber) {
					lastNobleGas = nobleGases[i]
				}
			}
			let seekedLayer = 1 + (typeof lastNobleGas === 'undefined' ? 0 : layers.findIndex(array => array.includes(this.protonNumber)))
			let indexes = []
			orbitals.forEach(function (orbital, i) {
				if (orbital.n === seekedLayer && (orbital.type === 0 || orbital.type === 1)) {
					indexes.push(i)
				} else if (orbital.n === seekedLayer - 1 && orbital.type === 2) {
					indexes.push(i)
				} else if (orbital.n === seekedLayer - 2 && orbital.type === 3) {
					indexes.push(i)
				}
			})

			return indexes
		},
		textForIndexes: function (indexes, orbitals) {
			let parts = []
			for (let i = 0; i < indexes.length; i++) {
				const orbital = orbitals[indexes[i]]
				parts.push(orbital.n + getOrbitalTypeText(orbital.type) + `<sup>${orbital.electronNumber}</sup>`)
			}
			return parts.join(" ")
		},
		setIonLimits: function () {
			[this.minIon, this.maxIon] = ionLimits(this.protonNumber, this.orbitalsView, this.shortOrbitalsIndexesView)
		},
		getOrbitalTypeText,
		getOrientations,
	},
}

// Modernizr
let isSMILAvailable = /SVGAnimate/.test((document.createElementNS('http://www.w3.org/2000/svg', 'animate')).toString())

function isInProtonNumberRange(n) {
	return n > 0 && n <= maxProtonNumber
}

function isWholeNumber(n) {
	return n === Math.floor(n)
}

function isValidProtonNumber(n) {
	return isInProtonNumberRange(n) && isWholeNumber(n)
}
