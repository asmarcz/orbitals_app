let cacheName = 'orbitals'
let filesToCache = [
	'/',
	'/css/bootstrap.min_4.3.1.css',
	'/js/vue.min_2.6.7.js',
	'/js/model.js',
	'/js/schrodinger.js',
	'/js/three.min.js',
	'/js/OrbitControls.js',
	'/assets/hide.svg',
	'/assets/open-fullscreen.svg',
	'/assets/plus.svg',
	'/assets/points.svg'
]

self.addEventListener('install', function (e) {
	e.waitUntil(
		caches.open(cacheName).then(function (cache) {
			return cache.addAll(filesToCache)
		})
	)
})

self.addEventListener('activate', event => {
	event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', event => {
	event.respondWith(
		fetch(event.request).catch(function () {
			return caches.match(event.request)
		})
	)
})
