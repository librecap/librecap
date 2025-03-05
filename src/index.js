import { solve_pow_challenge, initialRequest, challengeRequest } from './challenge'

import './popup.css'
import './widget.css'

class Librecap {
	constructor() {
		this.defaultLogo =
			'data:image/webp;base64,UklGRjADAABXRUJQVlA4WAoAAAAQAAAAPwAAPwAAQUxQSHoBAAABkDr9fxppv5nMzjFzp3bVzVD9MWPdYeWR7v4HK2vXnq48dgvyGCUzX0Gt/r2YZH950UXEBMCvvbTNskxNHWYdZhHxMFaqSF4siz9OlKphZfHnMSVKD5HzXFOhLcuDpgoWctu/o7aAy1Sh+pDnXFOBJXhcpgJYPDYoGaOnNfFb5zwfc038OpNSnXj/YRAEge/7Pgp+eJ7n+b7vfX/h6BJKXSS9XiXELCS+JAQutfWICFujlsr735MRW/nbA3JbESHzCc9d2zTtdG724zMz9tYdhksgzBrbNAYArHTuQ15oVwEA5EVHjIgYLzM/ZIUzQJQ5shxGBZo8OaEBZEtTcvar6DBJqTw6EUmZIjr6pZy7KJ05lGyTiV7KujNyU1TNftSUQunbxk+K8iQ0pc/cuSZdb3IuMYd3caOmJjqxfJA0hJiLiOhdXvqYY//64BoRcZmJ5KW/o5zM++Wk/vsk//bAoRYH4aYLWteGGHTvUzroB5nVI0tk+2vgFwpWUDggkAEAAJALAJ0BKkAAQAA+nT6YSKIjoiSwGAwAsBOJbAMsAzUJsg8+U0tF6jk9Aipd+rbbT+YD9iPWV/wGox+gA1PwwoIo1V3S0s+SYvRS/jPcGN9PZ8j/DCQ+pQ2B0OLyDJQGYQzP9rIAAP7qG6PPXoChNe0jjitlmtX/4a6gWq+v3m441/+MP8XphJYPPafdOpaLrJ8kPzgbXNgyVOdFlWw8hXg/dGMocgDqDw22nuEF68gihncLuH0ROM7BodLdFfw2XmwszY95sLMeFdsnAD0nWzD8Y9gBledH06MDW9fLojscdMWfvZcB//EL6okVF9r4+XFPcnUkfMMJY+zv46tTfBC5NyIBZSkja9M1Gh3CQHuS4+3L2UdjEYPDvoynMY++FDjVzbJr038BAIQl684Q4/7xx2tOEYLu8tk2fQZJufTu5V2VKMseZBsB3WQRJoy5XDxQsvOudjiELKuwV6tuUhf+ZAFQsUB+KdFNCEAuy5jsOr2B6M1GgBAgg0cMpsI2ZTe+Q9OFmlt/4r7sTf9cAAA='
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

		const brandingInfo = {
			title: element.getAttribute('data-brand-title') || 'LibreCap',
			description:
				element.getAttribute('data-brand-description') ||
				'LibreCap is an open-source CAPTCHA alternative designed with privacy and data protection in mind.',
			logo: element.getAttribute('data-brand-logo') || this.defaultLogo,
			url: element.getAttribute('data-brand-url') || 'https://github.com/librecap/librecap',
			termsUrl:
				element.getAttribute('data-terms-url') ||
				'https://github.com/librecap/librecap/blob/main/Terms.md',
			privacyUrl:
				element.getAttribute('data-privacy-url') ||
				'https://github.com/librecap/librecap/blob/main/Privacy.md'
		}

		Object.entries(brandingInfo).forEach(([key, value]) => {
			container.setAttribute(`data-brand-${key}`, value)
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

		const brandTitle = element.getAttribute('data-brand-title') || 'LibreCap'
		const brandDescription =
			element.getAttribute('data-brand-description') ||
			'LibreCap is an open-source CAPTCHA alternative designed with privacy and data protection in mind.'
		const brandUrl =
			element.getAttribute('data-brand-url') || 'https://github.com/librecap/librecap'

		const brandLink = document.createElement('a')
		brandLink.href = brandUrl
		brandLink.target = '_blank'
		brandLink.rel = 'noopener noreferrer'
		brandLink.className = 'brand-link'

		const brandLogoImage = document.createElement('img')
		brandLogoImage.className = 'captcha-logo'
		brandLogoImage.src = brandingInfo.logo

		const brandTitleText = document.createElement('div')
		brandTitleText.className = 'captcha-title'
		brandTitleText.textContent = brandTitle

		brandLink.appendChild(brandLogoImage)
		brandLink.appendChild(brandTitleText)

		const linksContainer = document.createElement('div')
		linksContainer.className = 'links-container'

		const termsLink = document.createElement('a')
		termsLink.href = brandingInfo.termsUrl
		termsLink.className = 'captcha-link'
		termsLink.textContent = 'Terms'

		const privacyLink = document.createElement('a')
		privacyLink.href = brandingInfo.privacyUrl
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
					const powChallenges = await initialRequest(gatewayUrl, siteKey)
					const powSolution = await solve_pow_challenge(powChallenges.first)
					const imageChallenge = await challengeRequest(
						gatewayUrl,
						siteKey,
						powChallenges.first,
						powSolution
					)
					this.createChallengePopup(container, imageChallenge, brandingInfo)
				} catch (error) {
					console.error(error)
					this.showError(container, error.message)
					container.classList.remove('loading')
					return
				}
			}
		})
	}

	createSVGIcons() {
		return {
			reload: `<svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
			sound: `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`,
			info: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
			close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
			back: `<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`
		}
	}

	createChallengePopup(container, imageChallenge, brandingInfo) {
		const icons = this.createSVGIcons()

		if (this.activePopup) {
			this.activePopup.remove()
			this.activePopup = null
		}

		const popup = document.createElement('div')
		popup.className = 'libre-captcha-popup'
		popup.style.visibility = 'hidden'

		popup.brandingInfo = brandingInfo
		popup.triggerContainer = container

		const theme = container.getAttribute('data-theme') || 'auto'
		popup.setAttribute('data-theme', theme)

		this.activePopup = popup

		const challengeView = document.createElement('div')
		challengeView.className = 'challenge-view'
		challengeView.setAttribute('data-theme', theme)

		const exampleSection = document.createElement('div')
		exampleSection.className = 'challenge-example'

		const header = document.createElement('div')
		header.className = 'challenge-header'

		const title = document.createElement('div')
		title.className = 'challenge-title'
		title.innerText = 'Select all images containing a dog with the same facial expression'

		const controls = document.createElement('div')
		controls.className = 'challenge-controls'

		const buttons = [
			{ icon: icons.reload, title: 'New challenge' },
			{ icon: icons.sound, title: 'Sound challenge' },
			{ icon: icons.info, title: 'Information' }
		]

		buttons.forEach(({ icon, title }, index) => {
			const button = document.createElement('button')
			button.className = 'challenge-button'
			button.title = title
			button.innerHTML = icon

			if (index === 2) {
				button.addEventListener('click', () => {
					this.showInfoView(popup)
				})
			}

			controls.appendChild(button)
		})

		const exampleImage = document.createElement('div')
		exampleImage.className = 'example-image'
		const exampleImg = document.createElement('img')
		const blob = new Blob([imageChallenge.images[9]], { type: 'image/webp' })
		exampleImg.src = URL.createObjectURL(blob)
		exampleImage.appendChild(exampleImg)

		exampleImg.onload = () => {
			URL.revokeObjectURL(exampleImg.src)
		}

		header.appendChild(title)
		header.appendChild(controls)
		exampleSection.appendChild(header)
		exampleSection.appendChild(exampleImage)
		challengeView.appendChild(exampleSection)

		const grid = document.createElement('div')
		grid.className = 'challenge-grid'

		for (let i = 0; i < imageChallenge.images.length - 1; i++) {
			const imageContainer = document.createElement('div')
			imageContainer.className = 'challenge-image'

			const imageBytes = imageChallenge.images[i]
			const blob = new Blob([imageBytes], { type: 'image/webp' })
			const img = document.createElement('img')
			img.src = URL.createObjectURL(blob)

			imageContainer.appendChild(img)

			img.onload = () => {
				URL.revokeObjectURL(img.src)
			}

			imageContainer.addEventListener('click', () => {
				imageContainer.classList.toggle('selected')
				if (imageContainer.classList.contains('selected')) {
					this.selectedImages.add(i)
				} else {
					this.selectedImages.delete(i)
				}
				verifyButton.disabled = this.selectedImages.size === 0
			})

			grid.appendChild(imageContainer)
		}

		const verifyButton = document.createElement('button')
		verifyButton.className = 'verify-button'
		verifyButton.textContent = 'VERIFY'
		verifyButton.disabled = true

		verifyButton.addEventListener('click', () => {
			popup.classList.remove('active')
			this.selectedImages.clear()

			const checkbox = container.querySelector('.captcha-checkbox')
			if (checkbox) {
				checkbox.checked = true
			}
		})

		challengeView.appendChild(grid)
		challengeView.appendChild(verifyButton)

		const infoView = this.createInfoView(popup)

		popup.appendChild(challengeView)
		popup.appendChild(infoView)

		this.currentView = 'challenge'

		document.body.appendChild(popup)
		this.positionPopup(popup, container)

		popup.style.visibility = 'visible'
		popup.classList.add('active')

		return popup
	}

	createInfoView(popup) {
		const icons = this.createSVGIcons()
		const brandingInfo = popup.brandingInfo

		const infoContent = document.createElement('div')
		infoContent.className = 'info-content'

		if (popup.hasAttribute('data-theme')) {
			const theme = popup.getAttribute('data-theme')
			infoContent.setAttribute('data-theme', theme)
		}

		const infoHeader = document.createElement('div')
		infoHeader.className = 'info-header'

		const backButton = document.createElement('button')
		backButton.className = 'back-button'
		backButton.innerHTML = `${icons.back} Back to challenge`
		backButton.addEventListener('click', () => {
			this.showChallengeView(popup)
		})

		infoHeader.appendChild(backButton)

		const mainContent = document.createElement('div')
		mainContent.className = 'info-main-content'

		const logoContainer = document.createElement('div')
		logoContainer.className = 'info-logo-container'

		const logo = document.createElement('img')
		logo.className = 'info-logo'
		logo.src = brandingInfo.logo

		const brandTitleEl = document.createElement('div')
		brandTitleEl.className = 'info-brand-title'
		brandTitleEl.textContent = brandingInfo.title

		logoContainer.appendChild(logo)
		logoContainer.appendChild(brandTitleEl)

		const infoText = document.createElement('div')
		infoText.className = 'info-text'
		infoText.textContent = brandingInfo.description

		const githubButton = document.createElement('a')
		githubButton.href = brandingInfo.url
		githubButton.target = '_blank'
		githubButton.className = 'github-button'
		githubButton.innerHTML = `
			<svg viewBox="0 0 24 24" width="20" height="20">
				<path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
			</svg>
			View Source on GitHub
		`

		const githubContainer = document.createElement('div')
		githubContainer.className = 'github-container'
		githubContainer.appendChild(githubButton)

		const infoLinks = document.createElement('div')
		infoLinks.className = 'info-links'
		infoLinks.innerHTML = `
			<a href="${brandingInfo.termsUrl}" class="info-link" target="_blank">Terms</a>
			<a href="${brandingInfo.privacyUrl}" class="info-link" target="_blank">Privacy</a>
		`

		mainContent.appendChild(logoContainer)
		mainContent.appendChild(infoText)
		mainContent.appendChild(githubContainer)
		mainContent.appendChild(infoLinks)

		infoContent.appendChild(infoHeader)
		infoContent.appendChild(mainContent)

		return infoContent
	}

	showInfoView(popup) {
		const challengeView = popup.querySelector('.challenge-view')
		const infoContent = popup.querySelector('.info-content')

		challengeView.style.display = 'none'
		infoContent.style.display = 'flex'
		this.currentView = 'info'
	}

	showChallengeView(popup) {
		const challengeView = popup.querySelector('.challenge-view')
		const infoContent = popup.querySelector('.info-content')

		infoContent.style.display = 'none'
		challengeView.style.display = 'block'
		this.currentView = 'challenge'
	}

	positionPopup(popup, container) {
		const rect = container.getBoundingClientRect()
		const viewportWidth = window.innerWidth
		const viewportHeight = window.innerHeight
		const scrollY = window.scrollY
		const scrollX = window.scrollX

		popup.style.position = 'absolute'
		popup.style.left = '0'
		popup.style.top = '0'
		popup.style.visibility = 'hidden'
		popup.style.display = 'block'

		const popupWidth = popup.offsetWidth
		const popupHeight = popup.offsetHeight

		const spaceRight = viewportWidth - rect.right
		const spaceLeft = rect.left
		const spaceBelow = viewportHeight - rect.bottom
		const spaceAbove = rect.top

		let position

		if (spaceRight >= popupWidth + 10) {
			position = 'right'
		} else if (spaceLeft >= popupWidth + 10) {
			position = 'left'
		} else if (spaceAbove >= popupHeight + 10) {
			position = 'above'
		} else if (spaceBelow >= popupHeight + 10) {
			position = 'below'
		} else {
			position = 'center'
		}

		switch (position) {
			case 'right':
				popup.style.left = `${rect.right + 10 + scrollX}px`
				if (rect.top + popupHeight > viewportHeight + scrollY) {
					popup.style.top = `${viewportHeight + scrollY - popupHeight - 10}px`
				} else {
					popup.style.top = `${rect.top + scrollY}px`
				}
				break

			case 'left':
				popup.style.left = `${rect.left - popupWidth - 10 + scrollX}px`
				if (rect.top + popupHeight > viewportHeight + scrollY) {
					popup.style.top = `${viewportHeight + scrollY - popupHeight - 10}px`
				} else {
					popup.style.top = `${rect.top + scrollY}px`
				}
				break

			case 'above':
				popup.style.top = `${rect.top - popupHeight - 10 + scrollY}px`
				if (rect.left + popupWidth <= viewportWidth + scrollX) {
					popup.style.left = `${rect.left + scrollX}px`
				} else {
					popup.style.left = `${viewportWidth + scrollX - popupWidth - 10}px`
				}
				break

			case 'below':
				popup.style.top = `${rect.bottom + 10 + scrollY}px`
				if (rect.left + popupWidth <= viewportWidth + scrollX) {
					popup.style.left = `${rect.left + scrollX}px`
				} else {
					popup.style.left = `${viewportWidth + scrollX - popupWidth - 10}px`
				}
				break

			case 'center':
				popup.style.position = 'fixed'
				popup.style.top = '50%'
				popup.style.left = '50%'
				popup.style.transform = 'translate(-50%, -50%)'
				break
		}
	}
}

export default new Librecap()
