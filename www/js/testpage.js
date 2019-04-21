vueParams.data = () => {
	return {
		inputNumber: '',
		protonNumber: 0,
		inputData: '',
		isCorrect: true,
		correctSyntax: '',
		inputDataStripped: '',
		lastData: '',
	}
}

vueParams.methods = {
	check: function () {
		if (!isInProtonNumberRange(this.inputNumber)) {
			alert(`Proton number must be bigger than 0 and smaller than ${maxProtonNumber + 1}.`)
		} else if (!isWholeNumber(this.inputNumber)) {
			alert('Proton number must be an integer not a float.')
		} else if (this.inputData.trim() === '') {
			alert('Configuration must not be empty.')
		} else if (isValidProtonNumber(this.inputNumber)) {
			this.protonNumber = this.inputNumber
			this.lastData = this.inputData
			this.isCorrect = true
			let temp = this.removeSpaces(this.inputData)
				.replace(/^,+|,+$/g, '')
			if (temp.match(/[^0-9a-zA-Z,]/g) !== null) {
				this.isCorrect = false
			} else {
				this.inputDataStripped = temp
				temp = temp.split(',')
				let correctOrbitals = this.shortOrbitalsIndexes.map(e => {
					let orbital = this.orbitals[e]
					return orbital.n + getOrbitalTypeText(orbital.type) + orbital.electronNumber
				})
				this.correctSyntax = correctOrbitals.join(', ')

				if (correctOrbitals.length === temp.length) {
					for (let i = 0; i < temp.length; i++) {
						let index = correctOrbitals.findIndex(e => e === temp[i])
						if (index === -1) {
							this.isCorrect = false
							break
						} else {
							correctOrbitals[index] = undefined
						}
					}
				} else {
					this.isCorrect = false
				}
			}
		}
	},
	removeSpaces: function (string) {
		return string.replace(/\s/g, '')
	},
}

var app = new Vue(vueParams)
