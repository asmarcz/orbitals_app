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
	if (e.request.url.includes(".")) {
		e.respondWith(
			caches.match(e.request)
				.then(r => r || fetch(e.request))
		)
	} else { // is HTML
		const controller = new AbortController()
		const signal = controller.signal
		let tId = setTimeout(() => controller.abort(), 3000)
		if (navigator.onLine) {
			e.respondWith(
				fetch(e.request, {
					signal,
					headers: { "cache-control": "no-cache" },
				})
					.then(r => {
						clearTimeout(tId)
						if (r.ok) {
							return caches.open(cName)
								.then(cache => {
									cache.put(e.request.url, r.clone())
									return r
								})
						} else {
							throw new Error("Response wasn't ok.")
						}
					})
					.catch(() => caches.match(e.request))
			)
		} else {
			e.respondWith(
				caches.match(e.request)
			)
		}
	}
})
