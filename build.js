const fs = require('fs')
const path = require('path')
const cssnano = require('cssnano')
const postcss = require('postcss')
const UglifyJS = require('uglify-js')
const prettier = require('prettier')

// Create dist directory if it doesn't exist
const distDir = path.resolve(__dirname, 'dist')
if (!fs.existsSync(distDir)) {
	fs.mkdirSync(distDir)
}

// Get package version
const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'))
const version = packageJson.version

// Create license header
const currentYear = new Date().getFullYear()
const licenseHeader = `/*!
 * LibreCap v${version}
 * https://github.com/librecap/librecap
 * (c) ${currentYear} LibreCap Contributors
 * Released under the Apache 2.0 License
 */\n`

// Function to minify CSS and return as a JS string variable
async function processCssFile(filePath, variableName) {
	const css = fs.readFileSync(filePath, 'utf8')

	// Minify CSS with cssnano
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

	// Return as a JS variable declaration
	return `const ${variableName} = "${result.css.replace(/"/g, '\\"').replace(/\n/g, '')}";`
}

// Function to process JS file
function processJsFile(filePath) {
	const content = fs.readFileSync(filePath, 'utf8')

	// Remove all imports and exports as we'll handle them separately
	return content
		.replace(/import\s+(?:{[^}]*}\s+from\s+)?['"][^'"]+['"];?\n?/g, '') // Remove all imports
		.replace(/export default new Librecap\(\);?\n?/g, '') // Remove the default export
}

// Function to extract JS imports from a file
function extractJsImports(filePath) {
	const content = fs.readFileSync(filePath, 'utf8')
	// Match imports but exclude CSS imports
	const importRegex = /import\s+(?:{[^}]*}\s+from\s+)?['"]\.\/([^'"]+)['"];?/g
	const imports = new Set()
	let match

	while ((match = importRegex.exec(content))) {
		const importPath = match[1]
		if (!importPath.endsWith('.css')) {
			imports.add(importPath)
		}
	}

	return Array.from(imports)
}

// Function to process imported JS files
function processImportedJsFiles(indexFilePath) {
	const imports = extractJsImports(indexFilePath)
	const importedCode = []
	const processedFiles = new Set()

	// Process each imported file
	imports.forEach((importFile) => {
		const importPath = path.resolve(path.dirname(indexFilePath), importFile + '.js')

		if (processedFiles.has(importPath)) {
			return // Skip if already processed
		}

		// Check if file exists
		if (fs.existsSync(importPath)) {
			// Read the imported file
			let fileContent = fs.readFileSync(importPath, 'utf8')

			// Remove exports and imports
			fileContent = fileContent
				.replace(/import\s+(?:{[^}]*}\s+from\s+)?['"][^'"]+['"];?\n?/g, '') // Remove all imports
				.replace(/export\s+/g, '') // Remove export keyword
				.replace(/export\s+default\s+/g, '') // Remove export default
				.replace(/export\s+{[^}]*}/g, '') // Remove export lists

			importedCode.push(`// Imported from ${importFile}.js`)
			importedCode.push(fileContent)

			processedFiles.add(importPath)
		} else {
			console.warn(`Warning: Imported file ${importFile}.js not found.`)
		}
	})

	return importedCode.join('\n\n')
}

// Main build function
async function build() {
	console.log('Building librecap.js and librecap-min.js...')

	// Process CSS files
	const popupCssVar = await processCssFile(path.resolve(__dirname, 'src/popup.css'), 'POPUP_CSS')

	const widgetCssVar = await processCssFile(
		path.resolve(__dirname, 'src/widget.css'),
		'WIDGET_CSS'
	)

	// Get worker script content and minify it
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

	// Function to inject CSS into DOM
	const injectCssFunc = `
function injectCSS(...cssStrings) {
  const style = document.createElement('style');
  style.innerHTML = cssStrings.join('\\n');
  document.head.appendChild(style);
}`

	// Path to index.js
	const indexJsPath = path.resolve(__dirname, 'src/index.js')

	// Process imported JS files first
	let importedJsCode = processImportedJsFiles(indexJsPath)

	// Replace empty WORKER_SCRIPT with minified content
	importedJsCode = importedJsCode.replace(
		/const WORKER_SCRIPT = ``;?/,
		`const WORKER_SCRIPT = "${minifiedWorkerScript}";`
	)

	// Get JS content with imports and exports removed
	const indexJsContent = processJsFile(indexJsPath)

	// Modify the constructor to inject CSS
	const modifiedIndexJs = indexJsContent.replace(
		/constructor\(\) {/,
		`constructor() {
    // Inject CSS into a single style element
    injectCSS(POPUP_CSS, WIDGET_CSS);`
	)

	// Combine all code
	const combinedCode = [
		'(function(global) {',
		popupCssVar,
		widgetCssVar,
		injectCssFunc,
		// Add the imported JS code before the Librecap class
		importedJsCode,
		modifiedIndexJs,
		// Create an instance and export it
		'const librecapInstance = new Librecap();',
		// Export for different environments
		'if (typeof window !== "undefined") { window.librecap = librecapInstance; }',
		'})(typeof window !== "undefined" ? window : this);'
	].join('\n\n')

	// Format unminified code with prettier
	let formattedCode = combinedCode
	try {
		// Get prettier config if it exists
		const prettierConfig = await prettier.resolveConfig(process.cwd())

		// Format the combined code
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

	// Write unminified version with license header
	const unminifiedWithHeader = licenseHeader + formattedCode
	fs.writeFileSync(path.resolve(distDir, 'librecap.js'), unminifiedWithHeader)

	// Minify the entire combined code for the minified version
	const minified = UglifyJS.minify(combinedCode, {
		output: {
			comments: /^!/ // Preserve comments that start with !
		}
	})

	if (minified.error) {
		console.error('Error minifying JavaScript:', minified.error)
		return
	}

	// Write minified version with license header
	fs.writeFileSync(path.resolve(distDir, 'librecap-min.js'), licenseHeader + minified.code)

	console.log('Build complete!')
}

// Run the build
build()
	.then(() => {
		// Calculate and print SRI hashes
		const { execSync } = require('child_process')
		const files = ['librecap.js', 'librecap-min.js']

		files.forEach((file) => {
			const filePath = path.resolve(distDir, file)
			const hash = execSync(
				`openssl dgst -sha512 -binary "${filePath}" | openssl base64 -A`
			).toString()
			console.log(`\nSRI hash for ${file}:`)
			console.log(`sha512-${hash}`)
		})
	})
	.catch((err) => {
		console.error('Build failed:', err)
		process.exit(1)
	})
