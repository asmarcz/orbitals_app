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
	let output = []
	let info = []
	for (let theta = 0; theta < Math.PI; theta += step) {
		for (let phi = 0; phi < 2 * Math.PI; phi += step) {
			for (let r = 0; r <= 30; r += radius) {
				let schro1 = (-1) ** ((m + Math.abs(m) + 2) / 2) * (1 / (n ** (l + 2))) * Math.sqrt((factorial(n - l - 1) * factorial(n + l) * factorial(l - Math.abs(m)) * (2 * l + 1)) / (Math.PI * factorial(l + Math.abs(m))))
				let schro2 = (r ** l) * (Math.E ** (-r / n))
				let schro3 = 0
				for (let j = 0; j <= (n - l - 1); j++) {
					schro3 += (((-2 * r) / n) ** (n - l - j - 1)) / (factorial(n + l - j) * factorial(j) * factorial(n - l - j - 1))
				}
				let schro4 = Math.sin(theta) ** (Math.abs(m))
				let schro5 = 0
				for (let j = 0; j <= ((l - Math.abs(m)) / 2); j++) {
					schro5 += ((((-1) ** j) * factorial(2 * l - 2 * j)) / (factorial(j) * factorial(l - j) * factorial(l - Math.abs(m) - 2 * j))) * (Math.cos(theta) ** (l - Math.abs(m) - 2 * j))
				}
				let schro6
				if (m > 0) {
					schro6 = Math.sqrt(2) * Math.sin(m * phi)
				} else if (m === 0) {
					schro6 = 1
				} else {
					schro6 = Math.sqrt(2) * Math.cos(m * phi)
				}
				let schro = schro1 * schro2 * schro3 * schro4 * schro5 * schro6
				schroSquared = schro ** 2
				if (schroSquared > 10 ** (-5)) {
					let sinTheta = Math.sin(theta)
					let x = r * sinTheta * Math.cos(phi)
					let y = r * sinTheta * Math.sin(phi)
					let z = r * Math.cos(theta)
					output.push(x, y, z)
					info.push(schro > 0 ? 1 : 0)
				}
			}
		}
	}
	return [output, info]
}
