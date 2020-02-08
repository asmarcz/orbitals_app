const crypto = require("crypto")
const fs = require("fs")
const path = require("path")
const babel = require("@babel/core")
const watch = require("node-watch")

let isDev = false
let WVars = false

for (let opt of process.argv) {
	switch (opt) {
		case "--dev":
			isDev = true
			break
		case "--WVars":
			WVars = true
			break
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

function getTime() {
	let d = new Date()
	let time = ""
	for (let part of [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()]) {
		time += part.toString().padStart(2, "0")
	}
	return time
}

const jsSrc = path.join(__dirname, "..", "src", "js")
const jsDist = path.join(__dirname, "..", "www", "js")
const cssSrc = path.join(__dirname, "..", "src", "css")
const cssDist = path.join(__dirname, "..", "www", "css")
const htmlSrc = path.join(__dirname, "..", "src", "templates")
const htmlDist = path.join(__dirname, "..", "www")

const defaults = {
	scripts: {},
	styles: {},
}

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
	if (isDiff(fresh.content, old.content)) {
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

let schemes = {
	scripts: {
		names: ["common", "homepage", "model", "OrbitControls", "schrodinger", "testpage", "Visualization"],
		dist: jsDist,
		src: jsSrc,
		ext: "js",
		vars: defaults.scripts,
		on: {
			fresh: function (fresh) {
				fresh.content = babel.transformSync(fresh.content, {
					presets: [["minify", {
						"mangle": false, // https://github.com/babel/minify/issues/556
					}]],
					sourceMaps: "inline",
					sourceRoot: path.dirname(fresh.path),
					sourceFileName: getPrefix(fresh.filename) + path.extname(fresh.filename),
				}).code
			},
		},
	},
	styles: {
		names: ["common", "homepage", "testpage"],
		dist: cssDist,
		src: cssSrc,
		ext: "css",
		vars: defaults.styles,
	},
	config: {
		names: ["config"],
		dist: jsDist,
		ext: "js",
		vars: defaults.scripts,
		on: {
			fresh: function (fresh) {
				for (let name of ["exceptions", "elements", "ranges", "layers", "nobleGases"]) {
					fresh.content += `const ${name}=` + fs.readFileSync(path.join(__dirname, "..", "config", `${name}.json`), "utf-8") + ";"
				}
			},
		},
	},
}

function doPrefix(prefix, schema) {
	let {dist, ext, on, src, vars} = schema

	const old = getOld(dist, prefix)
	if (typeof on !== "undefined" && typeof on.old !== "undefined") {
		on.old(old)
	}

	const fresh = {}
	fresh.filename = prefix + "_" + getTime() + "." + ext
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
				doPrefix(prefix, schema)
			}
		})
	}
	for (let prefix of schema.names) {
		doPrefix(prefix, schema)
	}
}

{
	function extractVars(template) {
		let ret = {}
		let regExp = /%> ([a-zA-Z]+) <%([\s\S]*?)%> \1 <%/g
		for (let match of template.matchAll(regExp)) {
			ret[match[1]] = match[2]
		}
		return ret
	}

	function replaceVars(template, vars) {
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
				template = template.replace("<% " + match[1] + " %>", value)
				matched = true
			}
		}
		return template
	}

	const layout = {}
	layout.filename = "layout.html"
	layout.path = path.join(htmlSrc, layout.filename)

	function loadLayoutContent() {
		layout.content = fs.readFileSync(layout.path, "utf-8")
	}

	function template(name) {
		let sub = fs.readFileSync(name, "utf-8")
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
	}
}
