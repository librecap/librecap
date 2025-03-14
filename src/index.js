import './fonts.css'
import './popup.css'
import './widget.css'
import { UI } from './ui'

class CaptchaConfig {
	constructor({
		siteKey,
		apiEndpoint,
		language,
		title,
		description,
		logo,
		url,
		githubUrl,
		termsUrl,
		privacyUrl
	}) {
		const defaults = {
			title: 'LibreCap',
			description:
				'LibreCap is an open-source CAPTCHA alternative designed with privacy and data protection in mind.',
			logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAABEVBMVEUAAAAAR3YANmcAeaMAdJ4ANWYApssAeKMAWYcAR3cApswAm8EAWocAqs8AUH4AkroARXUAo8kAfacArdIAjrYATHsApMoAcZwAlr0AdqAAn8UAbZgAc50AqM4AnsUAd6EAhK0ATXsApcoAhK0Ab5sAibIAn8UAgKkAUH4AosgAVIIAWocAOmsAOWkAXIkApMoARnUAU4EAW4gARnUAaZYATXwAZJAAstYAN2gANWYAgasANWYAZpMAa5cAYI0Af6kAcJsAXYoAc54AWYcAkLgAUX8AeqQATXsAha4AosgAl74AR3cAlLsAdqEAm8EAQnIAO2sAnsUAY48AVYIAirIApswAPm4AV4QAjLQArNEAsNTbvwG7AAAAO3RSTlMABmguB7stvGhoXBe8sL9PMg7s6XIU7uzc266KHPXt7ergzL27pnNkWT0l793LypOCckju2rSxppxG0bWmi08AAAISSURBVFjDtdRpV9pAGIbhSUGjSWuAEksaKFtZZXcvUK1FwirYiq38/x/SWEugzgNn3jn6fL/uw4Rk2OsuWNA0Q5f3Wio26/dT2aAc92djM9f3b2+rcgVt4W9uslLnT3l+EJF5DoWY5wcjQ+YEK34Ulgms+I5MoLC/9B2ZI+ippZd6iKzq+U5G7j3w/O+wVCDr+TvBgL69Oi3i+btEzre6KObV93+37+6Tu8HS93q9RMhdPB7/8LgjGySCp/P5/OFh5r2///kLd91ud3x1dXnZbrdbJyb/yCi+1drhAqck/+NEeR54R/Jf3/IBkkcBkv8GAiSPAiT/HQRIHgXW+zHvf4EAyf/c4wIfSR4FSP4aBEgeBUjeAQGSd465gBEZRTJhwwinN/lKLZ+vHyedw13GbbugP90sucQ6f1A3mTul2AgobMOMxBqfZ4Kz8e+3meh8IeQPAsKBoIqef8VkwlPx9yPsFRV+P37hQNRC70+yKBzI4fevLuqLFvROMrCR+fXFn6hi7zh7i4Jf4b0v/SWT80WjPtta54fDZC1gmsX8WXmL/zGZC3chy4qD81//88PJ5LBULk2nzeYZd4D00/U73uwn9/fTR9/cUrgAwcOASvA4QPA4QPA4QPA4QPA4QPA4QPAw8JngcYDgcYDgcYDgUYDZJN+s8ffBEcWXwOXUqIj78jkD0xs73na9vQE7N9nL7Q+B8yrHEF+yhAAAAABJRU5ErkJggg==',
			url: 'https://github.com/librecap/librecap',
			githubUrl: 'https://github.com/librecap/librecap',
			termsUrl: 'https://github.com/librecap/librecap/blob/main/TERMS.md',
			privacyUrl: 'https://github.com/librecap/librecap/blob/main/PRIVACY.md'
		}

		this.siteKey = siteKey
		this.apiEndpoint = apiEndpoint

		if (
			language &&
			['en', 'es', 'fr', 'de', 'it', 'pt', 'zh-CN', 'ja', 'ko', 'ru', 'ar', 'hi'].includes(
				language
			)
		) {
			this.language = language
		} else {
			this.language = null
		}

		const htmlEscape = (str) => {
			if (typeof str !== 'string') return str
			return str.replace(
				/[&<>"']/g,
				(match) =>
					({
						'&': '&amp;',
						'<': '&lt;',
						'>': '&gt;',
						'"': '&quot;',
						"'": '&#39;'
					})[match]
			)
		}

		const getConfigValue = (value, defaultValue, shouldEscape = true) => {
			const configValue =
				value === null ? undefined : value !== undefined ? value : defaultValue
			return shouldEscape && typeof configValue === 'string'
				? htmlEscape(configValue)
				: configValue
		}

		const getConfigValueAndCheckUrl = (value, defaultValue) => {
			const configValue = getConfigValue(value, defaultValue, false)
			if (!configValue) return undefined

			try {
				const url = new URL(configValue)
				const escapedUrl =
					url.protocol +
					'//' +
					htmlEscape(url.hostname) +
					(url.port ? ':' + url.port : '') +
					htmlEscape(url.pathname) +
					(url.search ? htmlEscape(url.search) : '') +
					(url.hash ? htmlEscape(url.hash) : '')
				return escapedUrl
			} catch {
				return undefined
			}
		}

		this.title = getConfigValue(title, defaults.title)
		this.description = getConfigValue(description, defaults.description)
		this.logo = getConfigValue(logo, defaults.logo, false)
		this.url = getConfigValueAndCheckUrl(url, defaults.url)
		this.githubUrl = getConfigValueAndCheckUrl(githubUrl, defaults.githubUrl)
		this.termsUrl = getConfigValueAndCheckUrl(termsUrl, defaults.termsUrl)
		this.privacyUrl = getConfigValueAndCheckUrl(privacyUrl, defaults.privacyUrl)
	}
}

class Librecap {
	constructor() {
		this.init()
		this.ui = new UI()
		console.warn('Librecap is currently in development and not ready for production use.')
	}

	init() {
		const libreCaptchaWidgetElements = document.querySelectorAll(
			'.librecap, .librecaptcha, .libre-captcha'
		)
		libreCaptchaWidgetElements.forEach((widget) => this.createCaptchaWidget(widget))
	}

	createCaptchaWidget(element) {
		const container = document.createElement('div')
		container.className = 'libre-captcha-widget'

		const theme = element.getAttribute('data-theme') || 'auto'
		container.setAttribute('data-theme', theme)

		const language = element.getAttribute('language') || null

		const siteKey = element.getAttribute('data-sitekey') || null
		let apiEndpoint = element.getAttribute('data-endpoint') || null

		if (!apiEndpoint) {
			apiEndpoint = siteKey ? `https://librecap.tn3w.dev/librecap/v1` : `/librecap/v1`
		}

		const getAttr = (name) => {
			if (element.hasAttribute(name)) {
				const value = element.getAttribute(name)
				if (value !== '') {
					return value
				}

				return null
			}

			return undefined
		}

		const config = new CaptchaConfig({
			siteKey,
			apiEndpoint,
			language,
			title: getAttr('data-brand-title'),
			description: getAttr('data-brand-description'),
			logo: getAttr('data-brand-logo'),
			url: getAttr('data-brand-url'),
			githubUrl: getAttr('data-brand-github'),
			termsUrl: getAttr('data-brand-terms'),
			privacyUrl: getAttr('data-brand-privacy')
		})

		const errorSection = document.createElement('div')
		errorSection.className = 'error-section'
		const errorMessage = document.createElement('div')
		errorMessage.className = 'error-message'
		errorSection.appendChild(errorMessage)

		const checkboxContainer = document.createElement('div')
		checkboxContainer.className = 'checkbox-container'

		const checkboxWrapper = document.createElement('div')
		checkboxWrapper.className = 'checkbox-wrapper'

		const checkbox = document.createElement('input')
		checkbox.type = 'checkbox'
		checkbox.className = 'captcha-checkbox'

		const loadingSpinner = document.createElement('div')
		loadingSpinner.className = 'loading-spinner'

		const label = document.createElement('label')
		label.className = 'captcha-label'
		label.textContent = 'I am human'

		const brandingContainer = document.createElement('div')
		brandingContainer.className = 'branding-container'

		if (config.url !== undefined || config.title !== undefined || config.logo !== undefined) {
			const brandLink = document.createElement(config.url !== undefined ? 'a' : 'div')
			brandLink.className = 'brand-link'

			if (config.url !== undefined) {
				brandLink.href = config.url
				brandLink.target = '_blank'
				brandLink.rel = 'noopener noreferrer'
			}

			if (config.logo !== undefined) {
				const brandLogoImage = document.createElement('img')
				brandLogoImage.className = 'captcha-logo'
				brandLogoImage.src = config.logo
				brandLink.appendChild(brandLogoImage)
			}

			if (config.title !== undefined) {
				const brandTitleText = document.createElement('div')
				brandTitleText.className = 'captcha-title'
				brandTitleText.textContent = config.title
				brandLink.appendChild(brandTitleText)
			}

			brandingContainer.appendChild(brandLink)
		}

		const linksContainer = document.createElement('div')
		linksContainer.className = 'links-container'

		if (config.termsUrl !== undefined) {
			const termsLink = document.createElement('a')
			termsLink.href = config.termsUrl
			termsLink.className = 'captcha-link'
			termsLink.textContent = 'Terms'
			linksContainer.appendChild(termsLink)
		}

		if (config.privacyUrl !== undefined) {
			const privacyLink = document.createElement('a')
			privacyLink.href = config.privacyUrl
			privacyLink.className = 'captcha-link'
			privacyLink.textContent = 'Privacy'
			linksContainer.appendChild(privacyLink)
		}

		checkboxWrapper.appendChild(checkbox)
		checkboxWrapper.appendChild(loadingSpinner)
		checkboxContainer.appendChild(checkboxWrapper)
		checkboxContainer.appendChild(label)

		if (linksContainer.hasChildNodes()) {
			brandingContainer.appendChild(linksContainer)
		}

		container.appendChild(checkboxContainer)
		if (brandingContainer.hasChildNodes()) {
			container.appendChild(brandingContainer)
		}
		container.appendChild(errorSection)

		element.replaceWith(container)

		checkbox.addEventListener('change', async (event) => {
			event.preventDefault()
			if (event.target.checked) {
				event.target.checked = false
				container.classList.add('loading')

				try {
					await this.ui.newImageChallenge(container, config)
					container.classList.remove('loading')
				} catch (error) {
					console.error(error)
					this.ui.showError(container, error.message)
					container.classList.remove('loading')
					return
				}
			}
		})
	}
}

export default new Librecap()
