function isWebGLAvailable() {
	try {
		let canvas = document.createElement('canvas')
		return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
	} catch (e) {
		return false
	}
}

function setHeight(el) {
	let styles = getComputedStyle(el)
	if (window.innerHeight > window.innerWidth) {
		el.style.height = styles.width
	} else {
		el.style.height = styles.height
	}
}

function closeFullscreen() {
	if (document.exitFullscreen) {
		document.exitFullscreen()
	} else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen()
	} else if (document.webkitExitFullscreen) {
		document.webkitExitFullscreen()
	} else if (document.msExitFullscreen) {
		document.msExitFullscreen()
	}
}

function isFullscreenAvailable() {
	if (document.body.requestFullscreen) {
		return true
	} else if (document.body.mozRequestFullScreen) {
		return true
	} else if (document.body.webkitRequestFullscreen) {
		return true
	} else if (document.body.msRequestFullscreen) {
		return true
	} else {
		return false
	}
}

// use instead of $nextTick to force browser to repaint and show user wait message
// Google search: double requestAnimationFrame
function doubleAnimationFrame(callable) {
	requestAnimationFrame(function () {
		requestAnimationFrame(function () {
			callable()
		})
	})
}

vueParams.data = function () {
	return {
		inputNumber: '',
		protonNumber: 0,
		electronNumber: 0,
		opened: null,
		hash: '',
		models: [],
		visualizations: [],
		isWebGLAvailable: isWebGLAvailable(),
		mS: [],
		inputShort: true,
		showShort: true,
		isFullscreenAvailable: isFullscreenAvailable(),
	}
}

Object.assign(vueParams.computed, {
	elementIndex: function () {
		return elements.findIndex((e) => e[0] === this.protonNumber)
	},
	valenceIndexes: function () {
		return getValenceIndexes(this.orbitals, this.protonNumber, ranges, layers).filter(index => index !== -1)
	},
	displayOrbitalsIndexes: function () {
		if (this.showShort) {
			return this.shortOrbitalsIndexes
		} else {
			return [...this.orbitals.keys()]
		}
	},
	nobleGasNumber: function () {
		for (let i = nobleGases.length; 0 <= i; i--) {
			if (nobleGases[i] < this.protonNumber) {
				return nobleGases[i]
			}
		}

		return -1
	},
	nobleGasIndex: function () {
		return elements.findIndex(el => el[0] === this.nobleGasNumber)
	},
	layerElectrons: function () {
		let tmp = []
		tmp.valences = []
		this.orbitals.forEach((orbital, index) => {
			let i = orbital.n - 1
			if (typeof tmp[i] === 'undefined') {
				tmp[i] = 0
			}
			tmp[i] += orbital.electronNumber

			if (this.valenceIndexes.includes(index)) {
				if (typeof tmp.valences[i] === 'undefined') {
					tmp.valences[i] = 0
				}
				tmp.valences[i] += orbital.electronNumber
			}
		})
		return tmp
	},
})

vueParams.methods = {
	calculate: function () {
		if (!isInProtonNumberRange(this.inputNumber)) {
			alert(`Proton number must be bigger than 0 and smaller than ${maxProtonNumber + 1}.`)
		} else if (!isWholeNumber(this.inputNumber)) {
			alert('Proton number must be an integer not a float.')
		} else if (isValidProtonNumber(this.inputNumber)) {
			this.protonNumber = this.inputNumber
			this.electronNumber = this.inputNumber
			window.location.hash = '#' + this.protonNumber
			this.showShort = this.inputShort

			hideKeyboard()
		}
	},
	toggleOpen: function (index, ev) {
		if (this.opened !== null) {
			if (typeof this.visualizations[this.opened] !== 'undefined') {
				this.visualizations[this.opened].continue = false
			}
		}
		if (this.opened === index) {
			this.opened = null
		} else {
			this.opened = index
			if (typeof this.visualizations[index] !== 'undefined') {
				this.visualizations[index].continue = true
				this.visualizations[index].animate(0)
			}

			let el = ev.currentTarget.nextElementSibling
			let canvas = el.querySelector('.canvas')
			this.$nextTick(function () {
				setHeight(canvas)

				let bottom = el.getBoundingClientRect().bottom
				if (bottom > window.innerHeight) {
					let y = window.pageYOffset + bottom - window.innerHeight
					window.scrollTo({
						top: y,
						behavior: 'smooth'
					})

					// fix for unsupported scrollToOptions
					if (window.pageYOffset === 0) {
						window.scrollTo(0, y)
					}
				}
			})
		}
	},
	addModel: function (index, ev) {
		if (!this.models.includes(index) && this.isWebGLAvailable) {
			this.models.push(index)
			let visualizationElement = ev.currentTarget.querySelector('.renderer')
			let orbital = this.orbitals[index]

			doubleAnimationFrame(() => {
				this.changeVisualization(visualizationElement, index, orbital.n, orbital.type, this.mS[index], 0.1, 0.2)
				this.visualizations[index].showControls()
			})
		}
	},
	changeVisualization: function (element, index, n, l, m, step, radius) {
		let visualization = new Visualization(element)
		visualization.init(n, l, m, step, radius)
		this.$set(this.visualizations, index, visualization)
	},
	enableKeys: function (index) {
		if (typeof this.visualizations[index] !== 'undefined') {
			this.visualizations[index].controls.enableKeys = true
		}
	},
	getRowIconAddress: function (show) {
		return basePath + '/assets/' + (show ? 'plus' : 'hide') + '.svg'
	},
	getFullscreenIconAddress: function (index) {
		return basePath + '/assets/' + (typeof this.visualizations[index] !== 'undefined' && this.visualizations[index].isFullscreen ? 'close' : 'open') + '-fullscreen.svg'
	},
	toggleFullscreen: function (index) {
		if (this.visualizations[index].isFullscreen) {
			closeFullscreen()
		} else {
			this.visualizations[index].isFullscreen = true
			this.visualizations[index].openFullscreen()
		}
	},
}

vueParams.beforeMount = function () {
	this.hash = window.location.hash
}

vueParams.watch = {
	hash: function () {
		let afterHash = parseFloat(this.hash.substring(1))
		if (isValidProtonNumber(afterHash)) {
			this.protonNumber = this.inputNumber = afterHash
		} else if (this.hash === '' || this.hash === '#') {
			this.inputNumber = ''
			this.protonNumber = 0
		}
	},
	orbitals: function () {
		this.mS = (new Array(this.orbitals.length)).fill(0)
	},
	mS: function () {
		if (typeof this.visualizations[this.opened] !== 'undefined') {
			let element = this.visualizations[this.opened].renderEl
			element.querySelector('canvas').remove()
			let orbital = this.orbitals[this.opened]

			this.visualizations[this.opened].hideControls()
			doubleAnimationFrame(() => {
				this.changeVisualization(element, this.opened, orbital.n, orbital.type, this.mS[this.opened], 0.1, 0.2)
				this.visualizations[this.opened].showControls()
			})
		}
	},
}

let bohrModelTemplate = document.getElementById('bohr-model-template')
	.innerHTML
	.trim()

class CircleSpace {
	constructor(start, end, circleLength) {
		if (start >= circleLength || end >= circleLength) {
			throw new Error('Start and end must be within circle length.')
		}
		this.start = start
		this.end = end
		this.circleLength = circleLength
	}

	get length() {
		if (this.start > this.end) {
			return this.circleLength - this.start + this.end + 1
		} else {
			return this.end - this.start + 1
		}
	}
}

vueParams.components = {
	'bohr-model': {
		template: '#bohr-model',
		props: ['layer-electrons'],
		data() {
			return {
				url: '',
			}
		},
		watch: {
			layerElectrons: {
				immediate: true,
				handler() {
					let template = document.createElement('template')
					template.innerHTML = bohrModelTemplate
					let svg = template.content.firstChild
					let layer = svg.querySelector('#layer')
					let electron = svg.querySelector('#electron')

					let halfSpaceNeeded = 20 + (this.layerElectrons.length - 1) * 10 + 10
					let spaceNeeded = halfSpaceNeeded * 2
					svg.viewBox.baseVal.width = spaceNeeded
					svg.viewBox.baseVal.height = spaceNeeded

					this.layerElectrons.forEach((n, i) => {
						let newLayer = layer.cloneNode()
						let radius = 20 + i * 10
						newLayer.setAttribute('r', radius)
						svg.appendChild(newLayer)
						let duration = 15 + 15 * i

						let electrons = []

						let rotateOffset = 2 * Math.PI / n
						for (let j = 0; j < n; j++) {
							let newElectron = electron.cloneNode(true)
							let currentOffset = j * rotateOffset
							newElectron.setAttribute('cx', halfSpaceNeeded - radius * Math.cos(currentOffset))
							newElectron.setAttribute('cy', halfSpaceNeeded - radius * Math.sin(currentOffset))

							let animate = newElectron.children[0]
							animate.setAttribute('from', `0 ${halfSpaceNeeded} ${halfSpaceNeeded}`)
							animate.setAttribute('to', `360 ${halfSpaceNeeded} ${halfSpaceNeeded}`)
							animate.setAttribute('dur', duration)
							if (!isSMILAvailable) {
								newElectron.style.animation = `electron ${duration}s linear infinite`
							}

							electrons.push(newElectron)
						}

						let valences = this.layerElectrons.valences[i]
						if (typeof valences !== 'undefined' && valences > 0) {
							let marked = []
							let circleLength = electrons.length
							let biggestSpace = new CircleSpace(0, circleLength - 1, circleLength)

							while (marked.length < valences) {
								let compareLength = 0
								for (let k = 0; k < marked.length; k++) {
									let start = (marked[k] + 1) % circleLength
									let end = (marked[((k + 1) % marked.length)] + circleLength - 1) % circleLength
									if (marked.includes(start) || marked.includes(end)) {
										continue
									}
									let space = new CircleSpace(start, end, circleLength)
									if (space.length > compareLength) {
										biggestSpace = space
										compareLength = biggestSpace.length
									}
								}

								let toMark = (Math.ceil(biggestSpace.length / 2) + biggestSpace.start + circleLength - 1) % circleLength
								marked.push(toMark)
								marked.sort(function (a, b) {
									return a - b
								})
							}

							{
								let tmp = (new Array(circleLength)).fill(0)
								marked.forEach(function (index) {
									tmp[index] = 1
								})
								marked = tmp
							}

							let distributed
							do {
								distributed = false
								for (let k = 0; k < marked.length; k++) {
									if (marked[k] === 1) {
										let leftSpace = 0
										let rightSpace = 0
										for (let l = 1; l < marked.length; l++) {
											if (marked[(k + l) % circleLength] === 0) {
												rightSpace += 1
											} else {
												break
											}
										}
										for (let l = 1; l < marked.length; l++) {
											if (marked[(circleLength + k - l) % circleLength] === 0) {
												leftSpace += 1
											} else {
												break
											}
										}

										if (Math.abs(leftSpace - rightSpace) > 1) {
											distributed = true
											let offset = Math.ceil((leftSpace + rightSpace + 1) / 2)
											let toMark = ((circleLength + k - leftSpace) % circleLength) + offset - 1
											marked[toMark] = 1
											marked[k] = 0
										}
									}
								}
							} while (distributed)

							marked.forEach(function (isMarked, m) {
								if (isMarked === 1) {
									electrons[m].setAttribute('fill', 'darkorchid')
								}
							})
						}

						for (let e of electrons) {
							svg.appendChild(e)
						}
					})

					let blob = new Blob([template.innerHTML], {type: 'image/svg+xml'})
					let url = URL.createObjectURL(blob)
					URL.revokeObjectURL(this.url)

					this.url = url
				},
			},
		},
	},
}

var app = new Vue(vueParams)

window.addEventListener('hashchange', function () {
	app.hash = window.location.hash
})
window.addEventListener('click', function () {
	app.visualizations.forEach(function (visualization) {
		visualization.controls.enableKeys = false
	})
})
window.addEventListener('fullscreenchange', function () {
	if (document.fullscreenElement === null) {
		app.visualizations[app.opened].isFullscreen = false
	}
	app.visualizations[app.opened].onWindowResize()
})
