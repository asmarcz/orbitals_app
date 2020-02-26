// toCache gets generated here by build tool
let cName = "orbitals.app"

self.addEventListener("install", (e) => {
	self.skipWaiting()
	e.waitUntil(
		caches.delete(cName)
			.then(() => {
				caches.open(cName)
					.then(c => {
						c.addAll(toCache)
					})
			})
	)
})

self.addEventListener("fetch", (e) => {
	e.respondWith(
		caches.match(e.request)
			.then(r => r || fetch(e.request))
	)
})
