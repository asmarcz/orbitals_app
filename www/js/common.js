function sortElements() {
	elements.sort((first, second) => first[1].localeCompare(second[1]))
}

sortElements()

let vueParams = {
	el: '#app',
	computed: {
		orbitals: function () {
			let element = new Element(this.protonNumber)
			let mainQuantum = new QuantumLayer(1)
			let controller = new Controller(element, mainQuantum, exceptions)
			controller.initiate()
			controller.checkExceptions()
			return element.orbitals.filter(orbital => orbital.electronNumber > 0)
		},
		shortOrbitalsIndexes: function () {
			let lastNobleGas
			for (let i = nobleGases.length - 1; i >= 0; i--) {
				if (nobleGases[i] < this.protonNumber) {
					lastNobleGas = nobleGases[i]
				}
			}
			let seekedLayer = 1 + (typeof lastNobleGas === 'undefined' ? 0 : layers.findIndex(array => array.includes(this.protonNumber)))
			let indexes = []
			this.orbitals.forEach(function (orbital, i) {
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
	}
}

// Modernizr
let isSMILAvailable = /SVGAnimate/.test((document.createElementNS('http://www.w3.org/2000/svg', 'animate')).toString())
