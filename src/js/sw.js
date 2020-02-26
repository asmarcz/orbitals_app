// toCache gets generated here by build tool
let cName = "orbitals.app" + Math.floor(Date.now() / 1000)

self.addEventListener("install", (e) => {
	self.skipWaiting()
	e.waitUntil(
		caches.open(cName)
			.then(c => {
				c.addAll(toCache)
			})
	)
})

self.addEventListener("activate", () => {
	caches.keys()
		.then(keys => {
			for (let k of keys) {
				if (k !== cName) {
					caches.delete(k)
				}
			}
		})
})

self.addEventListener("fetch", (e) => {
	e.respondWith(
		caches.match(e.request)
			.then(r => r || fetch(e.request))
	)
})
