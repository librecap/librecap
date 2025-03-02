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

	createCaptchaWidget(element) {
		// Create the main container
		const container = document.createElement('div')
		container.className = 'libre-captcha-widget'

		// Get theme from data-theme attribute or default to 'auto' instead of 'light'
		const theme = element.getAttribute('data-theme') || 'auto'
		container.setAttribute('data-theme', theme)

		// Create checkbox container
		const checkboxContainer = document.createElement('div')
		checkboxContainer.className = 'checkbox-container'

		// Create checkbox wrapper
		const checkboxWrapper = document.createElement('div')
		checkboxWrapper.className = 'checkbox-wrapper'

		// Create checkbox
		const checkbox = document.createElement('input')
		checkbox.type = 'checkbox'
		checkbox.className = 'captcha-checkbox'

		// Create loading spinner
		const loadingSpinner = document.createElement('div')
		loadingSpinner.className = 'loading-spinner'

		// Create label
		const label = document.createElement('label')
		label.className = 'captcha-label'
		label.textContent = 'I am human'

		// Create branding container
		const brandingContainer = document.createElement('div')
		brandingContainer.className = 'branding-container'

		// Create a link wrapper for the branding
		const brandLink = document.createElement('a')
		brandLink.href = 'https://github.com/librecap/librecap'
		brandLink.target = '_blank'
		brandLink.rel = 'noopener noreferrer'
		brandLink.className = 'brand-link'

		// Create logo image
		const logoImage = document.createElement('img')
		logoImage.className = 'captcha-logo'
		logoImage.src =
			'data:image/webp;base64,UklGRjADAABXRUJQVlA4WAoAAAAQAAAAPwAAPwAAQUxQSHoBAAABkDr9fxppv5nMzjFzp3bVzVD9MWPdYeWR7v4HK2vXnq48dgvyGCUzX0Gt/r2YZH950UXEBMCvvbTNskxNHWYdZhHxMFaqSF4siz9OlKphZfHnMSVKD5HzXFOhLcuDpgoWctu/o7aAy1Sh+pDnXFOBJXhcpgJYPDYoGaOnNfFb5zwfc038OpNSnXj/YRAEge/7Pgp+eJ7n+b7vfX/h6BJKXSS9XiXELCS+JAQutfWICFujlsr735MRW/nbA3JbESHzCc9d2zTtdG724zMz9tYdhksgzBrbNAYArHTuQ15oVwEA5EVHjIgYLzM/ZIUzQJQ5shxGBZo8OaEBZEtTcvar6DBJqTw6EUmZIjr6pZy7KJ05lGyTiV7KujNyU1TNftSUQunbxk+K8iQ0pc/cuSZdb3IuMYd3caOmJjqxfJA0hJiLiOhdXvqYY//64BoRcZmJ5KW/o5zM++Wk/vsk//bAoRYH4aYLWteGGHTvUzroB5nVI0tk+2vgFwpWUDggkAEAAJALAJ0BKkAAQAA+nT6YSKIjoiSwGAwAsBOJbAMsAzUJsg8+U0tF6jk9Aipd+rbbT+YD9iPWV/wGox+gA1PwwoIo1V3S0s+SYvRS/jPcGN9PZ8j/DCQ+pQ2B0OLyDJQGYQzP9rIAAP7qG6PPXoChNe0jjitlmtX/4a6gWq+v3m441/+MP8XphJYPPafdOpaLrJ8kPzgbXNgyVOdFlWw8hXg/dGMocgDqDw22nuEF68gihncLuH0ROM7BodLdFfw2XmwszY95sLMeFdsnAD0nWzD8Y9gBledH06MDW9fLojscdMWfvZcB//EL6okVF9r4+XFPcnUkfMMJY+zv46tTfBC5NyIBZSkja9M1Gh3CQHuS4+3L2UdjEYPDvoynMY++FDjVzbJr038BAIQl684Q4/7xx2tOEYLu8tk2fQZJufTu5V2VKMseZBsB3WQRJoy5XDxQsvOudjiELKuwV6tuUhf+ZAFQsUB+KdFNCEAuy5jsOr2B6M1GgBAgg0cMpsI2ZTe+Q9OFmlt/4r7sTf9cAAA='
		logoImage.alt = 'LibreCap Logo'

		// Create title text
		const title = document.createElement('div')
		title.className = 'captcha-title'
		title.textContent = 'LibreCap'

		// Add logo and title to the brand link
		brandLink.appendChild(logoImage)
		brandLink.appendChild(title)

		// Create links container
		const linksContainer = document.createElement('div')
		linksContainer.className = 'links-container'

		// Create Terms link
		const termsLink = document.createElement('a')
		termsLink.href = '#'
		termsLink.className = 'captcha-link'
		termsLink.textContent = 'Terms'

		// Create Privacy link
		const privacyLink = document.createElement('a')
		privacyLink.href = '#'
		privacyLink.className = 'captcha-link'
		privacyLink.textContent = 'Privacy'

		// Assemble the components
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

		// Replace original element with our captcha box
		element.replaceWith(container)

		// Add event listener for checkbox
		checkbox.addEventListener('change', (e) => {
			if (e.target.checked) {
				container.classList.add('loading')

				// Create and show challenge popup after a brief delay
				setTimeout(() => {
					container.classList.remove('loading')
					const popup = this.createChallengePopup(container)
					popup.classList.add('active')

					// Reset checkbox state
					checkbox.checked = false
				}, 1000) // FIXME: This should be loading a challenge from the server
			}
		})
	}
}

export default new Librecap()
