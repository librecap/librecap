const fs = require('fs')
const path = require('path')
const cssnano = require('cssnano')
const postcss = require('postcss')
const UglifyJS = require('uglify-js')
const prettier = require('prettier')

const distDir = path.resolve(__dirname, 'dist')
if (!fs.existsSync(distDir)) {
	fs.mkdirSync(distDir)
}

const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'))
const version = packageJson.version

const currentYear = new Date().getFullYear()
const licenseHeader = `/*!
 * LibreCap v${version}
 * https://github.com/librecap/librecap
 * (c) ${currentYear} LibreCap Contributors
 * Released under the Apache 2.0 License
 */\n`

async function processCssFile(filePath, variableName) {
	const css = fs.readFileSync(filePath, 'utf8')

	const result = await postcss([
		cssnano({
			preset: [
				'default',
				{
					discardComments: { removeAll: true },
					normalizeWhitespace: true
				}
			]
		})
	]).process(css, { from: filePath })

	return `const ${variableName} = "${result.css.replace(/"/g, '\\"').replace(/\n/g, '')}";`
}

function processJsFile(filePath) {
	const content = fs.readFileSync(filePath, 'utf8')

	return content
		.replace(/import\s+(?:{[^}]*}\s+from\s+)?['"][^'"]+['"];?\n?/g, '')
		.replace(/export default new Librecap\(\);?\n?/g, '')
}

function extractJsImports(filePath) {
	const content = fs.readFileSync(filePath, 'utf8')
	const importRegex = /import\s+(?:{[^}]*}\s+from\s+)?['"]\.\/([^'"]+)['"];?/g
	const imports = new Set()
	let match

	while ((match = importRegex.exec(content))) {
		const importPath = match[1]
		imports.add(importPath)
	}

	return Array.from(imports)
}

function extractCssImports(filePath, visitedFiles = new Set()) {
	if (visitedFiles.has(filePath)) {
		return []
	}
	visitedFiles.add(filePath)

	const content = fs.readFileSync(filePath, 'utf8')
	const directCssImports = []

	const cssImportRegex = /import\s+['"]\.\/([^'"]+\.css)['"];?/g
	let match
	while ((match = cssImportRegex.exec(content))) {
		directCssImports.push(match[1])
	}

	const jsImports = extractJsImports(filePath)
	const allCssImports = [...directCssImports]

	for (const importFile of jsImports) {
		if (!importFile.endsWith('.css')) {
			const importPath = path.resolve(path.dirname(filePath), importFile + '.js')
			if (fs.existsSync(importPath)) {
				const nestedCssImports = extractCssImports(importPath, visitedFiles)
				allCssImports.push(...nestedCssImports)
			}
		}
	}

	return allCssImports
}

function processImportedJsFiles(indexFilePath, processedFiles = new Set()) {
	const imports = extractJsImports(indexFilePath).filter(
		(importFile) => !importFile.endsWith('.css')
	)
	const importedCode = []

	imports.forEach((importFile) => {
		const importPath = path.resolve(path.dirname(indexFilePath), importFile + '.js')

		if (processedFiles.has(importPath)) {
			return
		}

		if (fs.existsSync(importPath)) {
			let fileContent = fs.readFileSync(importPath, 'utf8')

			fileContent = fileContent
				.replace(/import\s+(?:{[^}]*}\s+from\s+)?['"][^'"]+['"];?\n?/g, '')
				.replace(/export\s+/g, '')
				.replace(/export\s+default\s+/g, '')
				.replace(/export\s+{[^}]*}/g, '')

			importedCode.push(fileContent)

			processedFiles.add(importPath)

			const nestedImports = processImportedJsFiles(importPath, processedFiles)
			if (nestedImports) {
				importedCode.push(nestedImports)
			}
		} else {
			console.warn(`Warning: Imported file ${importFile}.js not found.`)
		}
	})

	return importedCode.length > 0 ? importedCode.join('\n\n') : null
}

async function build() {
	console.log('Building librecap.js and librecap-min.js...')

	const indexJsPath = path.resolve(__dirname, 'src/index.js')

	const cssImports = extractCssImports(indexJsPath)
	const uniqueCssImports = [...new Set(cssImports)]

	const cssVariables = []
	for (const cssFile of uniqueCssImports) {
		const cssPath = path.resolve(__dirname, 'src', cssFile)
		const varName = `${path.basename(cssFile, '.css').toUpperCase()}_CSS`
		const cssVar = await processCssFile(cssPath, varName)
		cssVariables.push(cssVar)
	}

	const workerContent = fs.readFileSync(path.resolve(__dirname, 'src/pow_worker.js'), 'utf8')
	const minifiedWorker = UglifyJS.minify(workerContent, {
		compress: true,
		mangle: true
	})

	if (minifiedWorker.error) {
		console.error('Error minifying worker script:', minifiedWorker.error)
		return
	}

	const minifiedWorkerScript = minifiedWorker.code.replace(/"/g, '\\"').replace(/\n/g, '')

	const injectCssFunc = `
function injectCSS(...cssStrings) {
  const style = document.createElement('style');
  style.innerHTML = cssStrings.join('\\n');
  document.head.appendChild(style);
}`

	let importedJsCode = processImportedJsFiles(indexJsPath)

	importedJsCode = importedJsCode.replace(
		/const WORKER_SCRIPT = ``;?/,
		`const WORKER_SCRIPT = "${minifiedWorkerScript}";`
	)

	const indexJsContent = processJsFile(indexJsPath)

	const cssVarNames = uniqueCssImports
		.map((file) => `${path.basename(file, '.css').toUpperCase()}_CSS`)
		.join(', ')

	const modifiedIndexJs = indexJsContent.replace(
		/constructor\(\) {/,
		`constructor() {
    injectCSS(${cssVarNames});`
	)

	const combinedCode = [
		'(function(global) {',
		...cssVariables,
		injectCssFunc,
		importedJsCode,
		modifiedIndexJs,
		'const librecapInstance = new Librecap();',
		'if (typeof window !== "undefined") { window.librecap = librecapInstance; }',
		'})(typeof window !== "undefined" ? window : this);'
	].join('\n\n')

	let formattedCode = combinedCode
	try {
		const prettierConfig = await prettier.resolveConfig(process.cwd())

		formattedCode = await prettier.format(combinedCode, {
			...prettierConfig,
			parser: 'babel',
			printWidth: 100,
			tabWidth: 2,
			semi: true,
			singleQuote: true,
			trailingComma: 'es5'
		})
	} catch (error) {
		console.warn('Warning: Could not format code with prettier:', error.message)
	}

	const unminifiedWithHeader = licenseHeader + formattedCode
	fs.writeFileSync(path.resolve(distDir, 'librecap.js'), unminifiedWithHeader)

	const minified = UglifyJS.minify(combinedCode, {
		compress: {
			toplevel: true,
			unsafe: true,
			unsafe_math: true,
			unsafe_proto: true,
			unsafe_regexp: true,
			unsafe_Function: true,
			drop_console: true,
			pure_getters: true,
			passes: 3,
			global_defs: {
				DEBUG: false
			}
		},
		mangle: {
			toplevel: true,
			eval: true,
			keep_fnames: false,
			properties: {
				regex: /^_/
			}
		},
		output: {
			comments: /^!/,
			beautify: false
		}
	})

	if (minified.error) {
		console.error('Error minifying JavaScript:', minified.error)
		return
	}

	fs.writeFileSync(path.resolve(distDir, 'librecap-min.js'), licenseHeader + minified.code)

	console.log('Build complete!')
}

build()
	.then(() => {
		const { execSync } = require('child_process')
		const files = ['librecap.js', 'librecap-min.js']

		files.forEach((file) => {
			try {
				const filePath = path.resolve(distDir, file)
				const hash = execSync(
					`openssl dgst -sha512 -binary "${filePath}" | openssl base64 -A`
				).toString()
				console.log(`\nSRI hash for ${file}:`)
				console.log(`sha512-${hash}`)
			} catch (err) {
				console.warn(`Warning: Could not generate SRI hash for ${file}:`, err.message)
			}
		})
	})
	.catch((err) => {
		console.error('Build failed:', err)
		process.exit(1)
	})
