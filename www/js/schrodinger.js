function factorial(num) {
	if (num < 0)
		return -1;
	else if (num === 0)
		return 1;
	else {
		return (num * factorial(num - 1));
	}
}

function schrodinger(n, l, m, step = 0.1, radius = 0.1) {
	let info = []
	let psis = []
	let xs = []
	let ys = []
	let zs = []

	let schro1 = (-1) ** ((m + Math.abs(m) + 2) / 2) * (1 / (n ** (l + 2))) * Math.sqrt((factorial(n - l - 1) * factorial(n + l) * factorial(l - Math.abs(m)) * (2 * l + 1)) / (Math.PI * factorial(l + Math.abs(m))))
	for (let theta = 0; theta < Math.PI; theta += step) {
		let schro4 = Math.sin(theta) ** (Math.abs(m))
		let schro5 = 0
		for (let j = 0; j <= ((l - Math.abs(m)) / 2); j++) {
			schro5 += ((((-1) ** j) * factorial(2 * l - 2 * j)) / (factorial(j) * factorial(l - j) * factorial(l - Math.abs(m) - 2 * j))) * (Math.cos(theta) ** (l - Math.abs(m) - 2 * j))
		}
		let sinTheta = Math.sin(theta)
		for (let phi = 0; phi < 2 * Math.PI; phi += step) {
			let schro6
			if (m > 0) {
				schro6 = Math.sqrt(2) * Math.sin(m * phi)
			} else if (m === 0) {
				schro6 = 1
			} else {
				schro6 = Math.sqrt(2) * Math.cos(m * phi)
			}
			for (let r = 0; r <= 80; r += radius) {
				let schro2 = (r ** l) * (Math.E ** (-r / n))
				let schro3 = 0
				for (let j = 0; j <= (n - l - 1); j++) {
					schro3 += (((-2 * r) / n) ** (n - l - j - 1)) / (factorial(n + l - j) * factorial(j) * factorial(n - l - j - 1))
				}
				let schro = schro1 * schro2 * schro3 * schro4 * schro5 * schro6
				schroSquared = schro ** 2
				psis.push(schroSquared)

				let x = r * sinTheta * Math.cos(phi)
				let y = r * sinTheta * Math.sin(phi)
				let z = r * Math.cos(theta)
				xs.push(x)
				ys.push(y)
				zs.push(z)
				info.push(schro > 0 ? 1 : 0)
			}
		}
	}

	let maxPsi = psis.reduce((a, b) => Math.max(a, b))
	// David Manthey, Orbital Viewer, https://github.com/manthey/orbitalviewer/blob/aa49e320a1d52e49d4684d30ca8036b70f25c6da/ov.c#L2003-L2016
	let threshold = 10 ** (Math.log10(maxPsi) - 1 - 0.25 * (n - l))
	let result = [[], []]
	for (let i = 0; i < xs.length; i++) {
		if (psis[i] > threshold) {
			result[0].push(xs[i], ys[i], zs[i])
			result[1].push(info[i])
		}
	}
	return result
}
