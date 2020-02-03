class Visualization {
	constructor(element) {
		this.renderEl = element
		this.fullscreenEl = element.querySelector('img')
		this.fpsEl = element.querySelector('div')
		this.resolutionEl = element.querySelector('div:nth-child(2)')
		this.frames = 0
		this.lastTime = -1
		this.continue = true
		this.isFullscreen = false
		this.currentIndex = 0
		this.maxIndex = 25
		this.frameRates = new Array(this.maxIndex + 1)
		this.averageFrameRate = null
		this.needsDownsize = 0
		this.needsUpsize = 0
		this.width = this.renderEl.clientWidth
		this.height = this.renderEl.clientHeight

		// arrow function to keep reference of this to current object
		this.animate = (time) => {
			if (this.camera.hasChanged) {
				this.camera.hasChanged = false
				this.renderer.render(this.scene, this.camera)
			}
			this.frames++

			if (this.currentIndex === this.maxIndex + 1) {
				this.currentIndex = 0
			}
			this.frameRates[this.currentIndex] = this.frames / (time - this.lastTime) * 1000
			this.currentIndex++
			this.averageFrameRate = Math.round(this.frameRates.reduce((sum, el) => sum + el) / this.frameRates.length)
			this.fpsEl.innerHTML = this.averageFrameRate + ' FPS'
			this.renderEl.children[1].innerHTML = Math.round(this.width * window.devicePixelRatio) + 'x' + Math.round(this.height * window.devicePixelRatio)

			if (this.averageFrameRate < 35) {
				this.needsDownsize++
				if (this.needsDownsize === this.maxIndex) {
					this.needsDownsize = 0
					let newWidth = this.width * 0.8
					if (Math.ceil(newWidth) >= this.renderEl.clientWidth / 2) {
						this.width = newWidth
						this.height = this.height * 0.8
						this.renderer.setSize(this.width, this.height, false)
						this.camera.hasChanged = true
					}
				}
			} else {
				this.needsDownsize = 0
			}

			if (this.averageFrameRate > 55) {
				this.needsUpsize++
				if (this.needsUpsize === this.maxIndex) {
					this.needsUpsize = 0
					let newWidth = this.width * 1.25
					if (Math.floor(newWidth) <= this.renderEl.clientWidth) {
						this.width = newWidth
						this.height = this.height * 1.25
						this.renderer.setSize(this.width, this.height, false)
						this.camera.hasChanged = true
					}
				}
			} else {
				this.needsUpsize = 0
			}

			if (time >= this.lastTime + 1000) {
				this.lastTime = time
				this.frames = 0
			}

			if (this.continue) {
				requestAnimationFrame(this.animate)
			}
		}
	}

	init(n, l, m, step, radius) {
		this.scene = new THREE.Scene();
		this.renderer = new THREE.WebGLRenderer({antialias: true})
		this.renderer.setPixelRatio(window.devicePixelRatio)
		this.renderer.setSize(this.renderEl.clientWidth, this.renderEl.clientHeight, false)
		this.renderEl.appendChild(this.renderer.domElement)
		this.renderer.domElement.classList.add('w-100', 'h-100')
		this.scene.add(new THREE.AxesHelper(20))

		window.addEventListener('resize', () => {
			this.onWindowResize()
		}, false)

		this.prepareScene(n, l, m, step, radius)

		this.animate(0)
	}

	prepareScene(n, l, m, step, radius) {
		let geometry = new THREE.BufferGeometry()
		let colors = []

		let [positions, info] = schrodinger(n, l, m, step, radius)

		for (let i of info) {
			colors.push(i, 0, 1)
		}

		geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
		geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

		let material = new THREE.PointsMaterial({size: 1, vertexColors: THREE.VertexColors})
		let points = new THREE.Points(geometry, material)

		this.scene.add(points)

		let boundingBox = new THREE.Box3()
		boundingBox.setFromObject(points)
		let size = new THREE.Vector3()
		boundingBox.getSize(size)

		let FOV = 40

		let maxDimension = Math.max(size.x, size.y, size.z)
		let x = maxDimension / 2 / Math.tan(FOV * (Math.PI / 180) / 2) + maxDimension / 2

		this.camera = new THREE.PerspectiveCamera(FOV, this.renderEl.clientWidth / this.renderEl.clientHeight, 1, 1000)
		this.camera.position.set(x, 0, 0)
		this.camera.hasChanged = true
		this.scene.add(this.camera)

		this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
		this.controls.addEventListener('change', () => {
			this.camera.hasChanged = true
		})
	}

	onWindowResize() {
		this.width = this.renderEl.clientWidth
		this.height = this.renderEl.clientHeight
		this.renderer.setSize(this.width, this.height, false)
		this.camera.aspect = this.width / this.height
		this.camera.updateProjectionMatrix()
		this.camera.hasChanged = true
	}

	openFullscreen() {
		if (this.renderEl.requestFullscreen) {
			this.renderEl.requestFullscreen()
		} else if (this.renderEl.mozRequestFullScreen) {
			this.renderEl.mozRequestFullScreen()
		} else if (this.renderEl.webkitRequestFullscreen) {
			this.renderEl.webkitRequestFullscreen()
		} else if (this.renderEl.msRequestFullscreen) {
			this.renderEl.msRequestFullscreen()
		}
	}

	showControls() {
		this.fullscreenEl.classList.remove('d-none')
		this.fpsEl.classList.remove('d-none')
		this.resolutionEl.classList.remove('d-none')
	}

	hideControls() {
		this.fullscreenEl.classList.add('d-none')
		this.fpsEl.classList.add('d-none')
		this.resolutionEl.classList.add('d-none')
	}
}
