vueParams.data = () => { return {
	inputNumber: '',
	protonNumber: 0,
	inputData: '',
	isCorrect: true,
}
}

vueParams.methods = {
	check: function () {
		if (this.inputNumber < 1 || this.inputNumber > maxProtonNumber) {
			alert(`Proton number must be bigger than 0 and smaller than ${ maxProtonNumber + 1 }.`)
		} else if (this.inputNumber !== Math.floor(this.inputNumber)) {
			alert('Proton number must be an integer not a float.')
		} else {
			this.protonNumber = this.inputNumber
			this.isCorrect = true
			let temp = this.inputData.replace(/\s/g,'')
				.replace(/^,+|,+$/g, '')
			if (temp.match(/[^0-9a-zA-Z,]/g) !== null) {
				this.isCorrect = false
			} else {
				temp = temp.split(',')
				for (let i = 0; i < temp.length; i++) {
					let matches = /([0-9]+)([a-zA-Z])([0-9]+)/g.exec(temp[i])
					if (matches !== null && matches[0] === temp[i]) {
						let orbital = this.orbitals[this.shortOrbitalsIndexes[i]]
						if (typeof orbital !== 'undefined') {
							if (parseInt(matches[1]) === orbital.n && matches[2] === getOrbitalTypeText(orbital.type) && parseInt(matches[3]) === orbital.electronNumber) {
								continue
							}
						}
					}
					this.isCorrect = false
				}
			}
		}
	}
}

var app = new Vue(vueParams)
