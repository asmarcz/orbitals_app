const crypto = require("crypto")
const fs = require("fs")
const babel = require("@babel/core")

let time = ""
{
	let d = new Date()
	for (let part of [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()]) {
		time += part.toString().padStart(2, "0")
	}
}

const jsSrc = __dirname + "/../src/js"
const jsDist = __dirname + "/../www/js"
const cssSrc = __dirname + "/../src/css"
const cssDist = __dirname + "/../www/css"
const htmlSrc = __dirname + "/../src/templates"
const htmlDist = __dirname + "/../www"

const defaults = {
	scripts: {},
	styles: {},
}

function getOld(directory, prefix) {
	const old = {
		content: "",
	}
	for (let file of fs.readdirSync(directory)) {
		if (file.startsWith(prefix)) {
			old.filename = file
			old.path = directory + "/" + file
			old.content = fs.readFileSync(old.path, "utf-8")
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
			fs.unlinkSync(old.path)
		}
		fs.writeFileSync(fresh.path, fresh.content)
		return true
	}
	return false
}

let data = [
	{
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
				}).code
			},
		},
	},
	{
		names: ["common", "homepage", "testpage"],
		dist: cssDist,
		src: cssSrc,
		ext: "css",
		vars: defaults.styles,
	},
	{
		names: ["config"],
		dist: jsDist,
		ext: "js",
		vars: defaults.scripts,
		on: {
			fresh: function (fresh) {
				for (let name of ["exceptions", "elements", "ranges", "layers", "nobleGases"]) {
					fresh.content += `const ${name}=` + fs.readFileSync(__dirname + `/../config/${name}.json`, "utf-8") + ";"
				}
			},
		},
	},
]

for (let i = 0; i < data.length; i++) {
	let {dist, ext, names, on, src, vars} = data[i]
	for (let prefix of names) {
		const old = getOld(dist, prefix)
		if (typeof on !== "undefined" && typeof on.old !== "undefined") {
			on.old(old)
		}

		const fresh = {}
		fresh.filename = prefix + "_" + time + "." + ext
		fresh.path = dist + "/" + fresh.filename
		try {
			fresh.content = fs.readFileSync(src + "/" + prefix + "." + ext, "utf-8")
		} catch (e) {
			fresh.content = ""
		}
		if (typeof on !== "undefined" && typeof on.fresh !== "undefined") {
			on.fresh(fresh)
		}

		vars[prefix] = diffIt(fresh, old) ? fresh.filename : old.filename
	}
}

{
	Object.assign(defaults, {
		activeHome: "",
		activeTest: "",
		activeAbout: "",
		style: "",
		script: "",
	})

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
					throw new Error(`Variable ${match[1]} doesn't exist.`)
				}
				template = template.replace("<% " + match[1] + " %>", value)
				matched = true
			}
		}
		return template
	}

	let pages = ["index.html", "test.html", "about.html"]
	let layout = fs.readFileSync(htmlSrc + "/layout.html", "utf-8")
	for (let name of pages) {
		let sub = fs.readFileSync(htmlSrc + "/" + name, "utf-8")
		let vars = Object.assign(JSON.parse(JSON.stringify(defaults)), extractVars(sub))
		let fresh = replaceVars(layout, vars)
		fs.writeFileSync(htmlDist + "/" + name, fresh)
	}
}
