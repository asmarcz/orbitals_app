function compareCorrect(correct, test) {
	if (correct.length === test.length) {
		for (let i = 0; i < test.length; i++) {
			let index = correct.findIndex(e => e === test[i])
			if (index === -1) {
				return false
			} else {
				correct[index] = undefined
			}
		}
		return true
	}
	return false
}

vueParams.data = () => {
	return {
		inputNumber: '',
		protonNumber: 0,
		inputData: '',
		isCorrect: true,
		correctSyntaxNoEx: '',
		correctSyntax: '',
		inputDataStripped: '',
		lastData: '',
		showCorrect: false,
		isException: false,
		isExceptionCorrect: false,
	}
}

Object.assign(vueParams.methods, {
	check: function () {
		if (!isInProtonNumberRange(this.inputNumber)) {
			alert(`Proton number must be bigger than 0 and smaller than ${maxProtonNumber + 1}.`)
		} else if (!isWholeNumber(this.inputNumber)) {
			alert('Proton number must be an integer not a float.')
		} else if (this.inputData.trim() === '') {
			alert('Configuration must not be empty.')
		} else if (isValidProtonNumber(this.inputNumber)) {
			this.showCorrect = false
			this.isException = false
			this.isExceptionCorrect = false
			this.protonNumber = this.inputNumber
			this.lastData = this.inputData
			let temp = this.removeSpaces(this.inputData)
				.replace(/^,+|,+$/g, '')
			if (temp.match(/[^0-9a-zA-Z,]/g) !== null) {
				this.isCorrect = false
			} else {
				this.inputDataStripped = temp
				temp = temp.split(',')
				let correctOrbitals = this.shortOrbitalsIndexesNoEx.map(e => {
					let orbital = this.orbitalsNoEx[e]
					return orbital.n + getOrbitalTypeText(orbital.type) + orbital.electronNumber
				})
				this.correctSyntaxNoEx = correctOrbitals.join(', ')

				this.isCorrect = compareCorrect(correctOrbitals, temp)
				if (this.controllerNoEx.isException()) {
					this.isException = true
					correctOrbitals = this.shortOrbitalsIndexes.map(e => {
						let orbital = this.orbitals[e]
						return orbital.n + getOrbitalTypeText(orbital.type) + orbital.electronNumber
					})
					this.correctSyntax = correctOrbitals.join(', ')
					this.isExceptionCorrect = compareCorrect(correctOrbitals, temp)
				}
			}

			hideKeyboard()
		}
	},
	removeSpaces: function (string) {
		return string.replace(/\s/g, '')
	},
})

var app = new Vue(vueParams)
