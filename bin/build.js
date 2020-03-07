const crypto = require("crypto")
const fs = require("fs")
const path = require("path")
const terser = require("terser")
const watch = require("node-watch")

let isDev = false
let WVars = false
let timestamps = false
let samebuild = false
let overwrite = false

for (let opt of process.argv.slice(2)) {
	switch (opt) {
		case "--dev":
			isDev = true
			break
		case "--WVars":
			WVars = true
			break
		case "--timestamps":
			timestamps = true
			break
		case "--same-build":
			samebuild = true
			break
		case "--overwrite":
			overwrite = true
			break
		default:
			warning("Invalid option " + opt)
	}
}

function warning(message) {
	console.log("W: " + message)
}

function updating(name) {
	console.log("U: " + name)
}

function removing(name) {
	console.log("R: " + name)
}

let _time
function getTime() {
	function generate() {
		let d = new Date()
		let time = ""
		for (let part of [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()]) {
			time += part.toString().padStart(2, "0")
		}
		return time
	}
	if (samebuild) {
		if (typeof _time === "undefined") {
			_time = generate()
		}
		return _time
	}
	return generate()
}

const srcDir = path.join(__dirname, "..", "src")
const wwwDir =  path.join(__dirname, "..", "www")
const tmpDir = path.join(__dirname, "..", "tmp")
const jsSrc = path.join(srcDir, "js")
const jsDist = path.join(wwwDir, "js")
const cssSrc = path.join(srcDir, "css")
const cssDist = path.join(wwwDir, "css")
const htmlSrc = path.join(srcDir, "templates")
const htmlDist = wwwDir
const assetsDist = path.join(wwwDir, "assets")
const iconDist = path.join(wwwDir, "icon")

if (!fs.existsSync(tmpDir)) {
	fs.mkdirSync(tmpDir)
}

const defaults = {
	scripts: {
		vue: "vue.min_2.6.11.js",
		three: "three.min_r113.js",
	},
	styles: {
		bootstrap: "bootstrap.min_4.3.1.css",
	},
}

defaults.assets = fs.readdirSync(assetsDist)
defaults.icon = fs.readdirSync(iconDist)

let variableDeps = {}

function getPrefix(str) {
	return /[^_]+/.exec(path.basename(str))[0]
}

function getOld(directory, prefix, content = true) {
	const old = {
		content: "",
	}
	for (let file of fs.readdirSync(directory)) {
		if (file.startsWith(prefix)) {
			old.filename = file
			old.path = path.join(directory, file)
			if (content) old.content = fs.readFileSync(old.path, "utf-8")
			break
		}
	}
	return old
}

function isDiff(freshContent, oldContent) {
	function getHash(str) {
		return crypto.createHash("sha1")
			.update(str, "binary")
			.digest("base64")
	}

	return getHash(freshContent) !== getHash(oldContent)
}

function diffIt(fresh, old) {
	if (overwrite || isDiff(fresh.content, old.content)) {
		if (typeof old.path !== "undefined") {
			removing(old.path)
			fs.unlinkSync(old.path)
		}
		updating(fresh.path)
		fs.writeFileSync(fresh.path, fresh.content)
		return true
	}
	return false
}

const terserCacheFile = path.join(tmpDir, "terser_cache.json")
const nameCache = fs.existsSync(terserCacheFile) ? JSON.parse(fs.readFileSync(terserCacheFile, "utf-8")) : {}

function saveTerserCache() {
	fs.writeFileSync(terserCacheFile, JSON.stringify(nameCache))
}

function terserize(fresh) {
	const options = {
		mangle: {
			toplevel: true,
		},
		nameCache,
	}

	if (isDev) {
		Object.assign(options, {
			url: "inline",
			root: path.dirname(fresh.path),
			filename: getPrefix(fresh.filename) + path.extname(fresh.filename),
		})
	}

	let result = terser.minify({
		[fresh.path]: fresh.content,
	}, options)

	if (result.error) {
		if (result.error.name !== "SyntaxError") throw result.error
		warning("SyntaxError: " + fresh.path)
	} else {
		fresh.content = result.code
	}
}

let schemes = {
	scripts: {
		names: ["model", "OrbitControls", "schrodinger", "Visualization", "common", "homepage", "testpage",],
		dist: jsDist,
		src: jsSrc,
		ext: "js",
		vars: defaults.scripts,
		varsPath: "scripts",
		on: {
			fresh: terserize,
		},
	},
	styles: {
		names: ["common", "homepage", "testpage"],
		dist: cssDist,
		src: cssSrc,
		ext: "css",
		vars: defaults.styles,
		varsPath: "styles",
	},
	config: {
		names: ["config"],
		dist: jsDist,
		ext: "js",
		vars: defaults.scripts,
		varsPath: "scripts",
		on: {
			fresh: function (fresh) {
				for (let name of ["exceptions", "elements", "ranges", "layers", "nobleGases"]) {
					fresh.content += `const ${name}=` + fs.readFileSync(path.join(__dirname, "..", "config", `${name}.json`), "utf-8") + ";"
				}
			},
		},
	},
}

schemes.serviceWorker = {
	names: ["sw"],
	dist: wwwDir,
	src: jsSrc,
	ext: "js",
	vars: defaults.scripts,
	varsPath: "scripts",
	on: {
		fresh: function (fresh) {
			filenames = []
			if (!isDev) {
				filenames = ["/", "test", "about", "manifest.json"]
				for (let k of [["scripts", "js/"], ["styles", "css/"], ["assets", "assets/"], ["icon", "icon/"]]) {
					filenames = filenames.concat(
						Object.values(defaults[k[0]])
							.map(e => k[1] + e)
					)
				}
			}
			fresh.content = `const toCache=${JSON.stringify(filenames)}; ${fresh.content}`
			terserize(fresh)
		},
	},
	timestamps: false,
}

function doPrefix(prefix, schema) {
	let {dist, ext, on, src, vars} = schema

	const old = getOld(dist, prefix)
	if (typeof on !== "undefined" && typeof on.old !== "undefined") {
		on.old(old)
	}

	let ts
	if (typeof schema.timestamps === "undefined") {
		ts = timestamps
	} else {
		ts = schema.timestamps
	}
	const fresh = {}
	fresh.filename = prefix + (ts ? "_" + getTime() : "") + "." + ext
	fresh.path = path.join(dist, fresh.filename)
	if (typeof src !== "undefined") {
		fresh.content = fs.readFileSync(path.join(src, prefix + "." + ext), "utf-8")
	} else {
		fresh.content = ""
	}
	if (typeof on !== "undefined" && typeof on.fresh !== "undefined") {
		on.fresh(fresh)
	}

	vars[prefix] = diffIt(fresh, old) ? fresh.filename : old.filename
}

for (let key in schemes) {
	const schema = schemes[key]
	if (isDev && typeof schema.src !== "undefined") {
		watch(schema.src, (evt, name) => {
			let prefix = path.parse(name).name
			if (schema.names.includes(prefix)) {
				let oldVar = schema.vars[prefix]
				doPrefix(prefix, schema)
				if (oldVar !== schema.vars[prefix]) {
					for (let t in variableDeps) {
						if (variableDeps[t].includes(
							schema.varsPath + "." + prefix
						)) {
							if (t === layout.filename) {
								allTemplates()
							} else {
								template(path.join(htmlSrc, t))
							}
						}
					}
				}
			}
		})
	}
	for (let prefix of schema.names) {
		doPrefix(prefix, schema)
	}
}

function extractVars(template) {
	let ret = {}
	let regExp = /%> ([a-zA-Z]+) <%([\s\S]*?)%> \1 <%/g
	for (let match of template.matchAll(regExp)) {
		ret[match[1]] = match[2]
	}
	return ret
}

function replaceVars(template, vars) {
	function toString(a) {
		return typeof a === "object" ? JSON.stringify(a) : a
	}

	let matched = true
	let regExp = /<% ([a-zA-Z.]+) %>/g
	while (matched) {
		matched = false
		for (let match of template.matchAll(regExp)) {
			let value = vars[match[1]]
			let error = false
			if (match[1].includes(".")) {
				try {
					value = match[1].split(".")
						.reduce((ob, index) => ob[index], vars)
				} catch (e) {
					error = true
				}
			}
			if (typeof value === "undefined" || error) {
				if (WVars) {
					value = ""
					warning(`Variable ${match[1]} doesn't exist. Setting to empty string.`)
				} else {
					throw new Error(`Variable ${match[1]} doesn't exist.`)
				}
			}
			template = template.replace("<% " + match[1] + " %>", toString(value))
			matched = true
		}
	}
	return template
}

function listVars(template) {
	let regExp = /<% ([a-zA-Z.]+) %>/g
	let ret = []
	for (let match of template.matchAll(regExp)) {
		ret.push(match[1])
	}
	return ret
}

const layout = {}
layout.filename = "layout.html"
layout.path = path.join(htmlSrc, layout.filename)

function loadLayoutContent() {
	layout.content = fs.readFileSync(layout.path, "utf-8")
	variableDeps[layout.filename] = listVars(layout.content)
}

function template(name) {
	let sub = fs.readFileSync(name, "utf-8")
	variableDeps[path.basename(name)] = listVars(sub)
	let vars = Object.assign(JSON.parse(JSON.stringify(defaults)), extractVars(sub))
	let fresh = replaceVars(layout.content, vars)
	let newPath = path.join(htmlDist, path.basename(name))
	updating(newPath)
	fs.writeFileSync(newPath, fresh)
}

function allTemplates() {
	for (let name of fs.readdirSync(htmlSrc)) {
		if (name !== layout.filename) {
			template(path.join(htmlSrc, name))
		}
	}
}

loadLayoutContent()
allTemplates()
if (isDev) {
	watch(htmlSrc, function (evt, name) {
		switch (evt) {
			case "update":
				if (name === layout.path) {
					loadLayoutContent()
					allTemplates()
				} else {
					template(name)
				}
				break
			case "remove":
				const old = getOld(htmlDist, path.parse(name).name)
				let newPath = path.join(htmlDist, old.filename)
				removing(newPath)
				fs.unlinkSync(newPath)
				break
		}
	})

	process.on("SIGINT", function () {
		saveTerserCache()
		process.exit()
	})
} else {
	saveTerserCache()
}
