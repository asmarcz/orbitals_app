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

function scrollToContent() {
	doubleAnimationFrame(function () {
		doubleAnimationFrame(function () {
			let y = window.pageYOffset + calcForm.nextElementSibling.getBoundingClientRect().top
			window.scrollTo({
				top: y,
				behavior: 'smooth',
			})
		})
	})
}

let keysFlag = false

vueParams.data = function () {
	return Object.assign(data, {
		opened: null,
		hash: '',
		models: [],
		visualizations: [],
		isWebGLAvailable: isWebGLAvailable(),
		mS: [],
		inputShort: true,
		showShort: true,
		showExceptions: true,
		isFullscreenAvailable: isFullscreenAvailable(),
		svgModel: undefined,
	})
}

Object.assign(vueParams.computed, {
	valenceIndexes: function () {
		return getValenceIndexes(this.orbitalsView, this.protonNumber, ranges, layers).filter(index => index !== -1)
	},
	displayOrbitalsIndexes: function () {
		if (this.showShort) {
			return this.shortOrbitalsIndexesView
		} else {
			return [...this.orbitalsView.keys()]
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
		this.orbitalsView.forEach((orbital, index) => {
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
	elementIndex: function () {
		return elements.findIndex((e) => e[0] === this.protonNumber)
	},
})

Object.assign(vueParams.methods, {
	calculate: function () {
		if (!isInProtonNumberRange(this.inputNumber)) {
			alert(`Proton number must be bigger than 0 and smaller than ${maxProtonNumber + 1}.`)
		} else if (!isWholeNumber(this.inputNumber)) {
			alert('Proton number must be an integer not a float.')
		} else if (isValidProtonNumber(this.inputNumber)) {
			this.ion = 0
			this.protonNumber = this.inputNumber
			window.location.hash = '#' + this.protonNumber
			this.showShort = this.inputShort

			this.setIonLimits()

			hideKeyboard()
			scrollToContent()
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
		keysFlag = true
		if (!this.models.includes(index) && this.isWebGLAvailable) {
			this.models.push(index)
			let visualizationElement = ev.currentTarget.querySelector('.renderer')
			let orbital = this.orbitalsView[index]

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
		return 'assets/' + (show ? 'plus' : 'hide') + '.svg'
	},
	getFullscreenIconAddress: function (index) {
		return 'assets/' + (typeof this.visualizations[index] !== 'undefined' && this.visualizations[index].isFullscreen ? 'close' : 'open') + '-fullscreen.svg'
	},
	toggleFullscreen: function (index) {
		if (this.visualizations[index].isFullscreen) {
			closeFullscreen()
		} else {
			this.visualizations[index].isFullscreen = true
			this.visualizations[index].openFullscreen()
		}
	},
	coloring: function (index, fill) {
		let svgModel = document.getElementById("svg-model")
		let orbital = this.orbitalsView[index]
		let isValence = this.valenceIndexes.includes(index)
		let suffix = isValence ? "v-" : ""
		let offset = this.orbitalsView.filter((o, i) => {
			return o.n === orbital.n &&
				o.type < orbital.type &&
				!(isValence ^ this.valenceIndexes.includes(i))
		}).reduce((a, o) => a + o.electronNumber, 0)
		for (let i = 0; i < orbital.electronNumber; i++) {
			svgModel.getElementById(orbital.n + "-" + suffix + (i + 1 + offset))
				.setAttribute('stroke', fill)
		}
	},
})

vueParams.beforeMount = function () {
	this.hash = window.location.hash
}

vueParams.watch = {
	hash: function () {
		let afterHash = parseFloat(this.hash.substring(1))
		if (isValidProtonNumber(afterHash)) {
			let tmp = this.protonNumber
			this.protonNumber = this.inputNumber = afterHash
			if (tmp === 0) {
				scrollToContent()
			}
			this.setIonLimits()
		} else if (this.hash === '' || this.hash === '#') {
			this.inputNumber = ''
			this.protonNumber = 0
		}
	},
	orbitals: function () {
		this.mS = (new Array(this.orbitalsView.length)).fill(0)
	},
	mS: function () {
		if (typeof this.visualizations[this.opened] !== 'undefined') {
			let element = this.visualizations[this.opened].renderEl
			element.querySelector('canvas').remove()
			let orbital = this.orbitalsView[this.opened]

			this.visualizations[this.opened].hideControls()
			doubleAnimationFrame(() => {
				keysFlag = true
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

						let counter = 1
						let valenceCounter = 1
						for (let e of electrons) {
							if (e.getAttribute('fill') === 'green') {
								e.setAttribute('id', (i + 1) + '-' + counter)
								counter++
							} else {
								e.setAttribute('id', (i + 1) + '-v-' + valenceCounter)
								valenceCounter++
							}
							svg.appendChild(e)
						}
					})

					svgModel = svg.cloneNode(true)
					svgModel.setAttribute('id', 'svg-model')
					svgModel.setAttribute('class', 'mx-auto mw-100 d-block position-sticky')
					this.$nextTick(() => {
						let w = document.getElementById('svg-wrapper')
						let r = document.getElementById('svg-model')
						if (r) w.removeChild(r)
						w.appendChild(svgModel)
					})

					svg.setAttribute('width', 1080)
					svg.setAttribute('height', 1080)
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

let calcForm = document.getElementById('calc-form')

window.addEventListener('hashchange', function () {
	app.hash = window.location.hash
})
window.addEventListener('click', function (ev) {
	if (keysFlag) {
		app.visualizations.forEach(function (visualization) {
			visualization.controls.enableKeys = false
		})
		keysFlag = false
	}
})
window.addEventListener('fullscreenchange', function () {
	if (document.fullscreenElement === null) {
		app.visualizations[app.opened].isFullscreen = false
	}
	app.visualizations[app.opened].onWindowResize()
})
