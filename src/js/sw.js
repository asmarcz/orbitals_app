console.log("bar")
console.log(swFilename)
self.addEventListener("fetch", (e) => {
	e.respondWith(
		caches.match(e.request)
			.then(r => {
				if (typeof r === "undefined") {
					return fetch(e.request).then(res => {
						return caches.open("orbitals.app")
							.then(cache => {
								cache.put(e.request, res.clone());
								return res;
							});
					})
				}
				return r
			})
	)
	console.log(e)
})
