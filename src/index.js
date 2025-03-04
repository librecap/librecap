import { solve_pow_challenge, initialRequest, challengeRequest } from './challenge'

import './popup.css'
import './widget.css'

class Librecap {
	constructor() {
		this.init()
		this.selectedImages = new Set()
		this.activePopup = null
		this.activeOverlay = null
		this.activeInfoPage = null
		this.currentView = 'challenge'
	}

	init() {
		const libreCaptchaWidgetElements = document.querySelectorAll(
			'.librecap, .librecaptcha, .libre-captcha'
		)

		libreCaptchaWidgetElements.forEach((widget) => {
			this.createCaptchaWidget(widget)
		})
	}

	showError(widgetElement, errorMessage) {
		const errorSection = widgetElement.querySelector('.error-section')
		const errorMessageElement = errorSection.querySelector('.error-message')
		errorMessageElement.textContent = errorMessage
		errorSection.classList.add('active')

		setTimeout(() => {
			errorSection.classList.remove('active')
		}, 5000)
	}

	createCaptchaWidget(element) {
		const container = document.createElement('div')
		container.className = 'libre-captcha-widget'

		const theme = element.getAttribute('data-theme') || 'auto'
		container.setAttribute('data-theme', theme)

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

		const brandTitle = element.getAttribute('data-brand-title') || 'LibreCap'
		const brandUrl =
			element.getAttribute('data-brand-url') || 'https://github.com/librecap/librecap'
		const defaultLogo =
			'data:image/webp;base64,UklGRjADAABXRUJQVlA4WAoAAAAQAAAAPwAAPwAAQUxQSHoBAAABkDr9fxppv5nMzjFzp3bVzVD9MWPdYeWR7v4HK2vXnq48dgvyGCUzX0Gt/r2YZH950UXEBMCvvbTNskxNHWYdZhHxMFaqSF4siz9OlKphZfHnMSVKD5HzXFOhLcuDpgoWctu/o7aAy1Sh+pDnXFOBJXhcpgJYPDYoGaOnNfFb5zwfc038OpNSnXj/YRAEge/7Pgp+eJ7n+b7vfX/h6BJKXSS9XiXELCS+JAQutfWICFujlsr735MRW/nbA3JbESHzCc9d2zTtdG724zMz9tYdhksgzBrbNAYArHTuQ15oVwEA5EVHjIgYLzM/ZIUzQJQ5shxGBZo8OaEBZEtTcvar6DBJqTw6EUmZIjr6pZy7KJ05lGyTiV7KujNyU1TNftSUQunbxk+K8iQ0pc/cuSZdb3IuMYd3caOmJjqxfJA0hJiLiOhdXvqYY//64BoRcZmJ5KW/o5zM++Wk/vsk//bAoRYH4aYLWteGGHTvUzroB5nVI0tk+2vgFwpWUDggkAEAAJALAJ0BKkAAQAA+nT6YSKIjoiSwGAwAsBOJbAMsAzUJsg8+U0tF6jk9Aipd+rbbT+YD9iPWV/wGox+gA1PwwoIo1V3S0s+SYvRS/jPcGN9PZ8j/DCQ+pQ2B0OLyDJQGYQzP9rIAAP7qG6PPXoChNe0jjitlmtX/4a6gWq+v3m441/+MP8XphJYPPafdOpaLrJ8kPzgbXNgyVOdFlWw8hXg/dGMocgDqDw22nuEF68gihncLuH0ROM7BodLdFfw2XmwszY95sLMeFdsnAD0nWzD8Y9gBledH06MDW9fLojscdMWfvZcB//EL6okVF9r4+XFPcnUkfMMJY+zv46tTfBC5NyIBZSkja9M1Gh3CQHuS4+3L2UdjEYPDvoynMY++FDjVzbJr038BAIQl684Q4/7xx2tOEYLu8tk2fQZJufTu5V2VKMseZBsB3WQRJoy5XDxQsvOudjiELKuwV6tuUhf+ZAFQsUB+KdFNCEAuy5jsOr2B6M1GgBAgg0cMpsI2ZTe+Q9OFmlt/4r7sTf9cAAA='
		const brandLogo = element.getAttribute('data-brand-logo') || defaultLogo

		const brandLink = document.createElement('a')
		brandLink.href = brandUrl
		brandLink.target = '_blank'
		brandLink.rel = 'noopener noreferrer'
		brandLink.className = 'brand-link'

		const brandLogoImage = document.createElement('img')
		brandLogoImage.className = 'captcha-logo'
		brandLogoImage.src = brandLogo

		const brandTitleText = document.createElement('div')
		brandTitleText.className = 'captcha-title'
		brandTitleText.textContent = brandTitle

		brandLink.appendChild(brandLogoImage)
		brandLink.appendChild(brandTitleText)

		const linksContainer = document.createElement('div')
		linksContainer.className = 'links-container'

		const termsUrl =
			element.getAttribute('data-terms-url') ||
			'https://github.com/librecap/librecap/blob/main/Terms.md'
		const privacyUrl =
			element.getAttribute('data-privacy-url') ||
			'https://github.com/librecap/librecap/blob/main/Privacy.md'

		const termsLink = document.createElement('a')
		termsLink.href = termsUrl
		termsLink.className = 'captcha-link'
		termsLink.textContent = 'Terms'

		const privacyLink = document.createElement('a')
		privacyLink.href = privacyUrl
		privacyLink.className = 'captcha-link'
		privacyLink.textContent = 'Privacy'

		checkboxWrapper.appendChild(checkbox)
		checkboxWrapper.appendChild(loadingSpinner)
		checkboxContainer.appendChild(checkboxWrapper)
		checkboxContainer.appendChild(label)
		linksContainer.appendChild(termsLink)
		linksContainer.appendChild(privacyLink)
		brandingContainer.appendChild(brandLink)
		brandingContainer.appendChild(linksContainer)
		container.appendChild(checkboxContainer)
		container.appendChild(brandingContainer)
		container.appendChild(errorSection)

		element.replaceWith(container)

		const siteKey = element.getAttribute('data-site-key') || null
		let gatewayUrl = element.getAttribute('data-gateway') || null

		if (!gatewayUrl) {
			gatewayUrl = siteKey ? `https://librecap.tn3w.dev/librecap/v1` : `/librecap/v1`
		}

		checkbox.addEventListener('change', async (event) => {
			event.preventDefault()
			if (event.target.checked) {
				event.target.checked = false
				container.classList.add('loading')

				try {
					const challenges = await initialRequest(gatewayUrl, siteKey)
					const solution = await solve_pow_challenge(challenges.first)
					const response = await challengeRequest(
						gatewayUrl,
						siteKey,
						challenges.first,
						solution
					)
				} catch (error) {
					console.error(error)
					this.showError(container, error.message)
					container.classList.remove('loading')
					return
				}
			}
		})
	}

	createChallengePopup(container) {
		console.log('FIXME: Create challenge popup')
	}
}

export default new Librecap()
