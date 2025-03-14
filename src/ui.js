import {
	solve_pow_challenge,
	initialRequest,
	challengeRequest,
	audioChallengeRequest
} from './challenge'
import { ImageChallenge } from './image_challenge'
import { AudioChallenge } from './audio_challenge'

export class UI {
	constructor() {
		this.selectedImages = new Set()
		this.activePopup = null
		this.activeOverlay = null
		this.activeInfoPage = null
		this.currentView = 'challenge'
		this.previousView = null

		this.currentImagePowChallenge = null
		this.currentImageChallenge = null
		this.currentImageChallengeIndex = 0
		this.totalImageChallenges = 1
		this.selectedImagesPerChallenge = []

		this.currentAudioPowChallenge = null
		this.currentAudioChallenge = null
		this.currentAudioChallengeIndex = 0
		this.totalAudioChallenges = 1
		this.currentAudioInput = ''

		this._resizeHandler = null

		this.imageChallenge = new ImageChallenge(this)
		this.audioChallenge = new AudioChallenge(this)

		this.solve_pow_challenge = solve_pow_challenge
		this.initialRequest = initialRequest
		this.challengeRequest = challengeRequest
		this.audioChallengeRequest = audioChallengeRequest
	}

	createImageElement(imageBytes, onLoadCallback = null) {
		const blob = new Blob([imageBytes], { type: 'image/webp' })
		const img = document.createElement('img')
		const url = URL.createObjectURL(blob)
		img.src = url
		img.onload = () => {
			URL.revokeObjectURL(url)
			if (onLoadCallback) onLoadCallback()
		}
		return img
	}

	updateVerifyButton(button, challengeIndex) {
		if (!button) return
		const isLastChallenge = challengeIndex === this.totalImageChallenges - 1
		button.disabled = this.selectedImagesPerChallenge[challengeIndex]?.size === 0
		button.textContent = isLastChallenge ? 'VERIFY' : 'NEXT'
	}

	cleanup() {
		if (this._resizeHandler) {
			window.removeEventListener('resize', this._resizeHandler)
			this._resizeHandler = null
		}
		if (this.activePopup) {
			this.pauseAudioIfPlaying(this.activePopup)

			const audioPlayer = this.activePopup.querySelector('.audio-player')
			if (audioPlayer && audioPlayer.src && audioPlayer.src.startsWith('blob:')) {
				URL.revokeObjectURL(audioPlayer.src)
			}

			this.activePopup.remove()
			this.activePopup = null
		}
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

	async newImageChallenge(container, config) {
		try {
			const powChallenges = await initialRequest(config.apiEndpoint, config.siteKey)
			const powSolution = await solve_pow_challenge(powChallenges.first)
			const imageChallenge = await challengeRequest(
				config.apiEndpoint,
				config.siteKey,
				powChallenges.first,
				powSolution
			)

			this.currentImagePowChallenge = powChallenges.second
			this.currentImageChallenge = imageChallenge
			this.selectedImages.clear()

			this.currentImageChallengeIndex = 0
			this.totalImageChallenges = Math.floor((imageChallenge.images.length - 1) / 9)
			this.selectedImagesPerChallenge = Array(this.totalImageChallenges)
				.fill()
				.map(() => new Set())

			if (this.activePopup) {
				this.updateExistingPopup(imageChallenge)
			} else {
				this.createChallengePopup(container, imageChallenge, config)
			}
		} catch (error) {
			console.error('Challenge error:', error)
			this.showError(container, error.message || 'Failed to load challenge')
			container.classList.remove('loading')
		}
	}

	async newAudioChallenge(container, config) {
		try {
			const powChallenges = await initialRequest(config.apiEndpoint, config.siteKey)
			const powSolution = await solve_pow_challenge(powChallenges.first)
			const audioChallenge = await audioChallengeRequest(
				config.apiEndpoint,
				config.language,
				config.siteKey,
				powChallenges.first,
				powSolution
			)

			this.currentAudioPowChallenge = powChallenges.second
			this.currentAudioChallenge = audioChallenge
			this.currentAudioChallengeIndex = 0
			this.totalAudioChallenges = audioChallenge.audios.length
			this.currentAudioInput = ''

			if (this.activePopup) {
				if (!this.activePopup.querySelector('.sound-challenge-view')) {
					const soundChallengeView = this.audioChallenge.createSoundChallengeView(
						this.activePopup
					)
					soundChallengeView.classList.add('sound-challenge-view')
					this.activePopup.appendChild(soundChallengeView)
				}
				this.updateExistingAudioPopup(audioChallenge)
			} else {
				this.createChallengePopup(container, audioChallenge, config)
			}
		} catch (error) {
			console.error('Audio challenge error:', error)
			this.showError(container, error.message || 'Failed to load audio challenge')
			container.classList.remove('loading')
		}
	}

	updateExistingPopup(imageChallenge) {
		const progressIndicator = this.activePopup.querySelector('.challenge-progress')
		if (progressIndicator) {
			progressIndicator.textContent = `Challenge ${this.currentImageChallengeIndex + 1} of ${this.totalImageChallenges}`
		}

		const exampleImage = this.activePopup.querySelector('.example-image img')
		if (exampleImage) {
			const img = this.createImageElement(imageChallenge.images[0])
			exampleImage.parentNode.replaceChild(img, exampleImage)
		}

		const grid = this.activePopup.querySelector('.challenge-grid')
		const verifyButton = this.activePopup.querySelector('.verify-button')
		if (grid && verifyButton) {
			this.updateGrid(grid, imageChallenge, 0, verifyButton)
		}

		if (this.currentView === 'info') {
			this.showChallengeView(this.activePopup)
		}
	}

	updateExistingAudioPopup(audioChallenge) {
		const audioPlayer = this.activePopup.querySelector('.audio-player')

		if (audioPlayer) {
			if (audioPlayer.src && audioPlayer.src.startsWith('blob:')) {
				URL.revokeObjectURL(audioPlayer.src)
			}

			const blob = new Blob([audioChallenge.audios[this.currentAudioChallengeIndex]], {
				type: 'audio/mp3'
			})
			const url = URL.createObjectURL(blob)
			audioPlayer.src = url

			audioPlayer.addEventListener(
				'error',
				() => {
					console.error('Error loading audio')
					URL.revokeObjectURL(url)
				},
				{ once: true }
			)
		}

		const progressIndicator = this.activePopup.querySelector('.challenge-progress')
		if (progressIndicator) {
			progressIndicator.textContent = `Challenge ${this.currentAudioChallengeIndex + 1} of ${this.totalAudioChallenges}`
		}

		const verifyButton = this.activePopup.querySelector('.verify-button')
		if (verifyButton) {
			verifyButton.disabled = true
			verifyButton.textContent =
				this.currentAudioChallengeIndex < this.totalAudioChallenges - 1 ? 'NEXT' : 'VERIFY'
		}

		const inputField = this.activePopup.querySelector('.sound-input-field')
		if (inputField) {
			inputField.value = this.currentAudioInput
		}

		if (this.currentView === 'info') {
			this.showChallengeView(this.activePopup)
		}
	}

	updateGrid(grid, imageChallenge, challengeIndex, verifyButton) {
		grid.innerHTML = ''
		const startIndex = challengeIndex * 9

		this.selectedImages = this.selectedImagesPerChallenge[challengeIndex]

		if (!this.selectedImagesPerChallenge[challengeIndex]) {
			this.selectedImagesPerChallenge[challengeIndex] = new Set()
		}

		for (let i = startIndex; i < startIndex + 9; i++) {
			const imageContainer = document.createElement('div')
			imageContainer.className = 'challenge-image'

			if (this.selectedImagesPerChallenge[challengeIndex].has(i - startIndex)) {
				imageContainer.classList.add('selected')
			}

			const img = this.createImageElement(imageChallenge.images[i + 1])
			imageContainer.appendChild(img)

			imageContainer.addEventListener('click', () => {
				const wasSelected = imageContainer.classList.contains('selected')
				imageContainer.classList.toggle('selected')

				if (!wasSelected) {
					this.selectedImagesPerChallenge[challengeIndex].add(i - startIndex)
				} else {
					this.selectedImagesPerChallenge[challengeIndex].delete(i - startIndex)
				}

				this.updateVerifyButton(verifyButton, challengeIndex)
			})

			grid.appendChild(imageContainer)
		}

		this.updateVerifyButton(verifyButton, challengeIndex)

		const progressIndicator = this.activePopup.querySelector('.challenge-progress')
		if (progressIndicator) {
			progressIndicator.textContent = `Challenge ${challengeIndex + 1} of ${this.totalImageChallenges}`
		}
	}

	createSVGIcons() {
		return {
			reload: `<svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
			sound: `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`,
			image: `<svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>`,
			info: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
			close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
			back: `<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`
		}
	}

	createChallengePopup(container, challenge, config) {
		const icons = this.createSVGIcons()

		this.cleanup()

		const popup = document.createElement('div')
		popup.className = 'libre-captcha-popup'
		popup.style.visibility = 'hidden'

		popup.config = config
		popup.triggerContainer = container

		const theme = container.getAttribute('data-theme') || 'auto'
		popup.setAttribute('data-theme', theme)

		this.activePopup = popup

		const isAudioChallenge = challenge.audios && challenge.audios.length > 0
		const isImageChallenge = challenge.images && challenge.images.length > 0

		const challengeView = document.createElement('div')
		challengeView.className = 'challenge-view'
		challengeView.setAttribute('data-theme', theme)

		if (isImageChallenge) {
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
				{
					icon: icons.reload,
					title: 'New challenge',
					action: () => {
						const button = controls.children[0]
						button.classList.add('loading')

						const overlay = this.activePopup.querySelector('.progress-overlay')
						const overlayText = overlay.querySelector('.progress-overlay-text')
						const overlayFill = overlay.querySelector('.progress-overlay-fill')
						overlayText.textContent = '0 done'
						overlayFill.style.width = '0%'

						this.imageChallenge.newImageChallenge(container, config).finally(() => {
							button.classList.remove('loading')
						})
					}
				},
				{
					icon: icons.sound,
					title: 'Sound challenge',
					action: () => {
						const button = controls.children[1]
						button.classList.add('loading')

						if (
							this.audioChallenge.currentAudioChallenge &&
							this.audioChallenge.currentAudioChallenge.audios
						) {
							button.classList.remove('loading')
							this.showSoundChallengeView(popup)
						} else {
							this.audioChallenge.newAudioChallenge(container, config).finally(() => {
								button.classList.remove('loading')
								this.showSoundChallengeView(popup)
							})
						}
					}
				},
				{ icon: icons.info, title: 'Information', action: () => this.showInfoView(popup) }
			]

			buttons.forEach(({ icon, title, action }) => {
				const button = document.createElement('button')
				button.className = 'challenge-button'
				button.title = title
				button.innerHTML = icon
				if (action) {
					button.addEventListener('click', action)
				}
				controls.appendChild(button)
			})

			const exampleImage = document.createElement('div')
			exampleImage.className = 'example-image'
			const exampleImg = this.imageChallenge.createImageElement(challenge.images[0])
			exampleImage.appendChild(exampleImg)

			header.appendChild(title)
			header.appendChild(controls)
			exampleSection.appendChild(header)
			exampleSection.appendChild(exampleImage)
			challengeView.appendChild(exampleSection)

			this.imageChallenge.currentImageChallenge = challenge
			this.imageChallenge.totalImageChallenges = Math.floor((challenge.images.length - 1) / 9)
			this.imageChallenge.currentImageChallengeIndex = 0
			this.imageChallenge.selectedImagesPerChallenge = Array(
				this.imageChallenge.totalImageChallenges
			)
				.fill()
				.map(() => new Set())
		}

		const progressOverlay = document.createElement('div')
		progressOverlay.className = 'progress-overlay'

		const progressContent = document.createElement('div')
		progressContent.className = 'progress-overlay-content'

		const progressText = document.createElement('div')
		progressText.className = 'progress-overlay-text'
		progressText.textContent = '0 done'

		const progressBar = document.createElement('div')
		progressBar.className = 'progress-overlay-bar'

		const progressFill = document.createElement('div')
		progressFill.className = 'progress-overlay-fill'
		progressFill.style.width = '0%'

		progressBar.appendChild(progressFill)
		progressContent.appendChild(progressText)
		progressContent.appendChild(progressBar)
		progressOverlay.appendChild(progressContent)

		if (config.logo !== undefined || config.title !== undefined) {
			const brandSection = document.createElement('div')
			brandSection.className = 'progress-overlay-brand'

			if (config.logo !== undefined) {
				const brandLogo = document.createElement('img')
				brandLogo.src = config.logo
				if (config.title !== undefined) {
					brandLogo.alt = config.title
				}
				brandSection.appendChild(brandLogo)
			}

			if (config.title !== undefined) {
				const brandTitle = document.createElement('div')
				brandTitle.className = 'progress-overlay-brand-title'
				brandTitle.textContent = config.title
				brandSection.appendChild(brandTitle)
			}

			progressOverlay.appendChild(brandSection)
		}

		popup.appendChild(progressOverlay)

		const infoView = this.createInfoView(popup)
		popup.appendChild(infoView)

		if (isAudioChallenge) {
			const soundChallengeView = this.audioChallenge.createSoundChallengeView(popup)
			soundChallengeView.classList.add('sound-challenge-view')
			popup.appendChild(soundChallengeView)
			this.currentView = 'sound-challenge'

			setTimeout(() => {
				this.audioChallenge.updateExistingAudioPopup(challenge)
			}, 0)
		} else if (isImageChallenge) {
			popup.appendChild(challengeView)
			this.currentView = 'challenge'

			const grid = document.createElement('div')
			grid.className = 'challenge-grid'

			const verifyButton = document.createElement('button')
			verifyButton.className = 'verify-button'
			verifyButton.disabled = true
			verifyButton.textContent =
				this.imageChallenge.totalImageChallenges > 1 ? 'NEXT' : 'VERIFY'

			verifyButton.addEventListener('click', () => {
				const overlay = this.activePopup.querySelector('.progress-overlay')
				const overlayText = overlay.querySelector('.progress-overlay-text')
				const overlayFill = overlay.querySelector('.progress-overlay-fill')

				overlay.classList.add('active')

				if (
					this.imageChallenge.currentImageChallengeIndex <
					this.imageChallenge.totalImageChallenges - 1
				) {
					overlayText.textContent = `${this.imageChallenge.currentImageChallengeIndex + 1} done`
					const progress =
						((this.imageChallenge.currentImageChallengeIndex + 1) /
							this.imageChallenge.totalImageChallenges) *
						100
					overlayFill.style.width = `${progress}%`

					setTimeout(() => {
						overlay.classList.remove('active')
						this.imageChallenge.currentImageChallengeIndex++
						this.imageChallenge.updateGrid(
							grid,
							challenge,
							this.imageChallenge.currentImageChallengeIndex,
							verifyButton
						)
					}, 1000)
				} else {
					overlayText.textContent = `${this.imageChallenge.totalImageChallenges} done`
					overlayFill.style.width = '100%'

					setTimeout(() => {
						this.imageChallenge.handleVerification(container, popup)
					}, 1000)
				}
			})

			challengeView.appendChild(grid)
			challengeView.appendChild(verifyButton)

			this.imageChallenge.updateGrid(grid, challenge, 0, verifyButton)
		}

		document.body.appendChild(popup)
		this.positionPopup(popup, container)

		popup.style.visibility = 'visible'
		popup.classList.add('active')

		this._resizeHandler = () => {
			if (popup && popup.isConnected) {
				this.positionPopup(popup, container)
			} else {
				this.cleanup()
			}
		}
		window.addEventListener('resize', this._resizeHandler)

		return popup
	}

	handleVerification(container, popup) {
		try {
			this.pauseAudioIfPlaying(popup)

			if (this.currentImagePowChallenge && this.currentImageChallenge) {
				const selectedImagesData = this.selectedImagesPerChallenge.map((set, index) => ({
					challenge: index + 1,
					selectedIndexes: Array.from(set)
				}))

				console.log('Verification data:', {
					powChallenge: this.currentPowChallenge,
					imageChallenge: this.currentImageChallenge,
					selectedImages: selectedImagesData
				})
			}

			popup.classList.remove('active')
			this.selectedImagesPerChallenge = []
			this.currentChallengeIndex = 0

			const checkbox = container.querySelector('.captcha-checkbox')
			if (checkbox) {
				checkbox.checked = true
			}
		} catch (error) {
			console.error('Verification error:', error)
			this.showError(container, 'Failed to verify challenge')
		}
	}

	createInfoView(popup) {
		const icons = this.createSVGIcons()
		const config = popup.config

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
			if (this.previousView === 'sound-challenge') {
				this.showSoundChallengeView(popup)
			} else {
				this.showChallengeView(popup)
			}
		})

		infoHeader.appendChild(backButton)

		const mainContent = document.createElement('div')
		mainContent.className = 'info-main-content'

		if (config.logo !== undefined || config.title !== undefined) {
			const logoContainer = document.createElement('div')
			logoContainer.className = 'info-logo-container'

			const brandWrapper =
				config.url !== undefined
					? document.createElement('a')
					: document.createElement('div')

			if (config.url !== undefined) {
				brandWrapper.href = encodeURI(config.url)
				brandWrapper.target = '_blank'
				brandWrapper.rel = 'noopener noreferrer'
				brandWrapper.className = 'brand-wrapper'
			}

			if (config.logo !== undefined) {
				const logo = document.createElement('img')
				logo.className = 'info-logo'
				logo.src = encodeURI(config.logo)
				if (config.title !== undefined) {
					logo.alt = config.title
				}
				brandWrapper.appendChild(logo)
			}

			if (config.title !== undefined) {
				const brandTitleEl = document.createElement('div')
				brandTitleEl.className = 'info-brand-title'
				brandTitleEl.textContent = config.title
				brandWrapper.appendChild(brandTitleEl)
			}

			logoContainer.appendChild(brandWrapper)
			mainContent.appendChild(logoContainer)
		}

		if (config.description !== undefined) {
			const infoText = document.createElement('div')
			infoText.className = 'info-text'
			infoText.textContent = config.description
			mainContent.appendChild(infoText)
		}

		if (config.githubUrl !== undefined) {
			const githubContainer = document.createElement('div')
			githubContainer.className = 'github-container'
			const githubButton = document.createElement('a')
			githubButton.href = encodeURI(config.githubUrl)
			githubButton.target = '_blank'
			githubButton.rel = 'noopener noreferrer'
			githubButton.className = 'github-button'
			githubButton.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> View Source on GitHub`
			githubContainer.appendChild(githubButton)
			mainContent.appendChild(githubContainer)
		}

		const infoLinks = document.createElement('div')
		infoLinks.className = 'info-links'

		if (config.termsUrl !== undefined) {
			const termsLink = document.createElement('a')
			termsLink.href = encodeURI(config.termsUrl)
			termsLink.className = 'info-link'
			termsLink.target = '_blank'
			termsLink.rel = 'noopener noreferrer'
			termsLink.textContent = 'Terms'
			infoLinks.appendChild(termsLink)
		}

		if (config.privacyUrl !== undefined) {
			const privacyLink = document.createElement('a')
			privacyLink.href = encodeURI(config.privacyUrl)
			privacyLink.className = 'info-link'
			privacyLink.target = '_blank'
			privacyLink.rel = 'noopener noreferrer'
			privacyLink.textContent = 'Privacy'
			infoLinks.appendChild(privacyLink)
		}

		if (infoLinks.hasChildNodes()) {
			mainContent.appendChild(infoLinks)
		}

		infoContent.appendChild(infoHeader)
		infoContent.appendChild(mainContent)

		return infoContent
	}

	showInfoView(popup) {
		const mainChallengeView = popup.querySelector('.challenge-view:not(.sound-challenge-view)')
		const infoContent = popup.querySelector('.info-content')
		const soundChallengeView = popup.querySelector('.sound-challenge-view')

		this.previousView = this.currentView

		this.pauseAudioIfPlaying(popup)

		if (mainChallengeView) {
			mainChallengeView.style.display = 'none'
		}
		if (soundChallengeView) {
			soundChallengeView.style.display = 'none'
		}
		infoContent.style.display = 'flex'
		this.currentView = 'info'
	}

	showSoundChallengeView(popup) {
		if (!popup.querySelector('.sound-challenge-view')) {
			const soundChallengeView = this.audioChallenge.createSoundChallengeView(popup)
			soundChallengeView.classList.add('sound-challenge-view')
			popup.appendChild(soundChallengeView)

			if (
				this.audioChallenge.currentAudioChallenge &&
				this.audioChallenge.currentAudioChallenge.audios
			) {
				this.audioChallenge.updateExistingAudioPopup(
					this.audioChallenge.currentAudioChallenge
				)
			}
		}

		const mainChallengeView = popup.querySelector('.challenge-view:not(.sound-challenge-view)')
		const infoContent = popup.querySelector('.info-content')
		const soundChallengeView = popup.querySelector('.sound-challenge-view')

		if (mainChallengeView) {
			mainChallengeView.style.display = 'none'
		}
		infoContent.style.display = 'none'
		soundChallengeView.style.display = 'block'
		this.currentView = 'sound-challenge'
	}

	showChallengeView(popup) {
		const mainChallengeView = popup.querySelector('.challenge-view:not(.sound-challenge-view)')
		const infoContent = popup.querySelector('.info-content')
		const soundChallengeView = popup.querySelector('.sound-challenge-view')

		this.pauseAudioIfPlaying(popup)

		infoContent.style.display = 'none'
		if (soundChallengeView) {
			soundChallengeView.style.display = 'none'
		}
		if (mainChallengeView) {
			mainChallengeView.style.display = 'block'
		}
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
		popup.style.transform = ''
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

		let left, top

		switch (position) {
			case 'right':
				left = rect.right + 10 + scrollX
				top = rect.top + scrollY
				break

			case 'left':
				left = rect.left - popupWidth - 10 + scrollX
				top = rect.top + scrollY
				break

			case 'above':
				left = rect.left + scrollX
				top = rect.top - popupHeight - 10 + scrollY
				break

			case 'below':
				left = rect.left + scrollX
				top = rect.bottom + 10 + scrollY
				break

			case 'center':
				popup.style.position = 'fixed'
				popup.style.left = '50%'
				popup.style.top = '50%'
				popup.style.transform = 'translate(-50%, -50%)'
				return
		}

		if (left < scrollX) {
			left = scrollX + 10
		} else if (left + popupWidth > scrollX + viewportWidth) {
			left = scrollX + viewportWidth - popupWidth - 10
		}

		if (top < scrollY) {
			top = scrollY + 10
		} else if (top + popupHeight > scrollY + viewportHeight) {
			top = scrollY + viewportHeight - popupHeight - 10
		}

		popup.style.left = `${left}px`
		popup.style.top = `${top}px`
	}

	pauseAudioIfPlaying(popup) {
		const soundChallengeView = popup.querySelector('.sound-challenge-view')
		if (soundChallengeView && this.currentView === 'sound-challenge') {
			const audioPlayer = soundChallengeView.querySelector('.audio-player')
			if (audioPlayer) {
				try {
					audioPlayer.pause()
				} catch (e) {
					console.error('Error pausing audio:', e)
				}
			}
		}
	}
}
