function aufbauOrder(first, second) {
	let result = first.sum - second.sum;
	if (result === 0) {
		return first.n - second.n;
	}
	return result;
}

function mathModel(k, l) {
	return l + k * (k - 1) / 2;
}

function calcOrientationNumber(l) {
	return l * 2 + 1;
}

function getOrientations(l) {
	let tmp = []
	for (let i = -l; i <= l; i++) {
		tmp.push(i)
	}
	return tmp
}

function maxOrbitalElectronNumber(type) {
	return calcOrientationNumber(type) * 2;
}

function getOrbitalTypeText(number) {
	switch (number) {
		case 0:
			return 's';
		case 1:
			return 'p';
		case 2:
			return 'd';
		case 3:
			return 'f';
		case 4:
			return 'g';
		default:
			return number;
	}
}

function getValenceIndexes(orbitalsArray, protonNumber, ranges, layers) {
	if (orbitalsArray.length === 1) {
		return [0]
	}

	function findLast(type, n = null) {
		for (let i = orbitalsArray.length - 1; i >= 0; i--) {
			if (orbitalsArray[i].type === type && (orbitalsArray[i].n === n || n === null)) {
				return i
			}
		}
		return -1
	}

	let lastLayer
	for (let i = 1; i <= layers.length; i++) {
		if (layers[i].includes(protonNumber)) {
			lastLayer = i
		}
	}

	if (ranges[0].includes(protonNumber)) {
		return [findLast(0, lastLayer)]
	} else if (ranges[1].includes(protonNumber)) {
		return [findLast(0, lastLayer), findLast(1, lastLayer)]
	} else if (ranges[2].includes(protonNumber)) {
		return [findLast(0, lastLayer), findLast(2, lastLayer - 1)]
	} else if (ranges[3].includes(protonNumber)) {
		return [findLast(0, lastLayer), findLast(2, lastLayer - 1), findLast(3, lastLayer - 2)]
	}

	return -1
}

class Controller {
	constructor(element, quantumLayer, exceptions) {
		/** @type QuantumLayer[] */
		this.layerCollection = [quantumLayer];
		this.element = element;
		this.maxN = quantumLayer.n;
		this.exceptions = exceptions;
	}

	createQuantumLayer() {
		this.maxN++;
		this.layerCollection.push(new QuantumLayer(this.maxN));
	}

	hasMore() {
		let lastOrbital = this.element.orbitals[this.element.orbitals.length - 1];
		let toSubtract = this.element.countNumber - this.element.electronNumber;
		lastOrbital.electronNumber -= toSubtract;
		this.element.countNumber -= toSubtract;
	}

	initiate() {
		this.createQuantumLayer();
		while (this.element.electronNumber !== this.element.countNumber) {
			if (this.element.electronNumber < this.element.countNumber) {
				this.hasMore();
			} else {
				let newestLayer, secondNewestLayer;
				let secondMaxN = this.maxN - 1, collectionLength = this.layerCollection.length;
				for (let i = 0; i < collectionLength; i++) {
					if (this.layerCollection[i].n === secondMaxN) {
						secondNewestLayer = this.layerCollection[i];
						newestLayer = this.layerCollection[i + 1];
						break;
					}
				}
				if (newestLayer.lState === 0 && secondNewestLayer.lState !== 0) {
					this.createQuantumLayer();
				}

				this.layerCollection.sort(aufbauOrder);

				for (let layer of this.layerCollection) {
					if (layer.canBeUsed()) {
						this.element.addOrbital(layer.lState, layer.n);
						layer.lState++;
						break;
					}
				}
			}
		}
	}

	checkExceptions() {
		let lastDExceptionOrbital = this.element.orbitals.find((orbital) => {
			return orbital.type === 2 && (orbital.electronNumber === 4 || orbital.electronNumber === 9);
		});
		if (typeof lastDExceptionOrbital !== 'undefined') {
			let lastSOrbital = this.element.orbitals.slice().reverse().find((orbital) => {
				return orbital.type === 0;
			});
			lastSOrbital.electronNumber--;
			lastDExceptionOrbital.electronNumber++;
		}

		if (this.element.electronNumber in this.exceptions) {
			let orbitals = []
			for (let orbital of this.element.orbitals) {
				orbitals[mathModel(orbital.n, orbital.type)] = orbital
			}

			for (let index in this.exceptions[this.element.electronNumber]) {
				index = parseInt(index)
				if (typeof orbitals[index] === 'undefined') {
					let k = Math.floor(0.5 + Math.sqrt(1 + 8 * index) / 2)
					let l = index - k * (k - 1) / 2
					orbitals[index] = new Orbital(l, k)
					this.element.orbitals.push(orbitals[index])
				}
				orbitals[index].electronNumber = this.exceptions[this.element.electronNumber][index]
			}

			this.element.orbitals.sort(aufbauOrder)
		}
	}
}

class Orbital {
	constructor(type, n, electronNumber = maxOrbitalElectronNumber(type)) {
		this.type = type;
		this.n = n;
		this.electronNumber = electronNumber;
	}
}

class Element {
	constructor(protonNumber, electronNumber = protonNumber) {
		this.protonNumber = protonNumber;
		this.electronNumber = electronNumber;
		this.countNumber = 0;
		/** @type Orbital[] */
		this.orbitals = [];
	}

	addOrbital(type, n) {
		let orbital = new Orbital(type, n);
		this.orbitals.push(orbital);
		this.countNumber += orbital.electronNumber;
	}
}

class QuantumLayer {
	constructor(n) {
		this.n = n;
		this.lState = 0;
	}

	canBeUsed() {
		return this.n > this.lState;
	}

	get sum() {
		return this.n + this.lState;
	}
}
