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

	// Remove CSS imports and ES6 export statements (we'll handle exports differently)
	return content
		.replace(/import ['"]\.\/popup\.css['"];?\n?/g, '')
		.replace(/import ['"]\.\/widget\.css['"];?\n?/g, '')
		.replace(/export default new Librecap\(\);?\n?/g, '')
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

	// Function to inject CSS into DOM
	const injectCssFunc = `
function injectCSS(css) {
  const style = document.createElement('style');
  style.innerHTML = css;
  document.head.appendChild(style);
}`

	// Get JS content with imports and exports removed
	const indexJsContent = processJsFile(path.resolve(__dirname, 'src/index.js'))

	// Modify the constructor to inject CSS
	const modifiedIndexJs = indexJsContent.replace(
		/constructor\(\) {/,
		`constructor() {
    // Inject CSS
    injectCSS(POPUP_CSS);
    injectCSS(WIDGET_CSS);`
	)

	// Combine all code
	const combinedCode = [
		'(function(global) {',
		popupCssVar,
		widgetCssVar,
		injectCssFunc,
		modifiedIndexJs,
		// Create an instance and export it
		'const librecapInstance = new Librecap();',
		// Export for different environments
		'if (typeof module !== "undefined" && module.exports) { module.exports = librecapInstance; }',
		'else { global.librecap = librecapInstance; }',
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

	// Minify the combined code with preserve_copyright option
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
build().catch((err) => {
	console.error('Build failed:', err)
	process.exit(1)
})
