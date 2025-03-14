export class AudioChallenge {
	constructor(ui) {
		this.ui = ui
		this.currentAudioPowChallenge = null
		this.currentAudioChallenge = null
		this.currentAudioChallengeIndex = 0
		this.totalAudioChallenges = 1
		this.currentAudioInput = ''
	}

	async newAudioChallenge(container, config) {
		try {
			const powChallenges = await this.ui.initialRequest(config.apiEndpoint, config.siteKey)
			const powSolution = await this.ui.solve_pow_challenge(powChallenges.first)
			const audioChallenge = await this.ui.audioChallengeRequest(
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

			if (this.ui.activePopup) {
				if (!this.ui.activePopup.querySelector('.sound-challenge-view')) {
					const soundChallengeView = this.createSoundChallengeView(this.ui.activePopup)
					soundChallengeView.classList.add('sound-challenge-view')
					this.ui.activePopup.appendChild(soundChallengeView)
				}
				this.updateExistingAudioPopup(audioChallenge)
			} else {
				this.ui.createChallengePopup(container, audioChallenge, config)
			}
		} catch (error) {
			console.error('Audio challenge error:', error)
			this.ui.showError(container, error.message || 'Failed to load audio challenge')
			container.classList.remove('loading')
		}
	}

	updateExistingAudioPopup(audioChallenge) {
		const audioPlayer = this.ui.activePopup.querySelector('.audio-player')

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

		const progressIndicator = this.ui.activePopup.querySelector('.challenge-progress')
		if (progressIndicator) {
			progressIndicator.textContent = `Challenge ${this.currentAudioChallengeIndex + 1} of ${this.totalAudioChallenges}`
		}

		const verifyButton = this.ui.activePopup.querySelector('.verify-button')
		if (verifyButton) {
			verifyButton.disabled = true
			verifyButton.textContent =
				this.currentAudioChallengeIndex < this.totalAudioChallenges - 1 ? 'NEXT' : 'VERIFY'
		}

		const inputField = this.ui.activePopup.querySelector('.sound-input-field')
		if (inputField) {
			inputField.value = this.currentAudioInput
		}

		if (this.ui.currentView === 'info') {
			this.ui.showChallengeView(this.ui.activePopup)
		}
	}

	createSoundChallengeView(popup) {
		const icons = this.ui.createSVGIcons()

		const soundChallengeView = document.createElement('div')
		soundChallengeView.className = 'challenge-view'

		if (popup.hasAttribute('data-theme')) {
			const theme = popup.getAttribute('data-theme')
			soundChallengeView.setAttribute('data-theme', theme)
		}

		const exampleSection = document.createElement('div')
		exampleSection.className = 'challenge-example'

		const header = document.createElement('div')
		header.className = 'challenge-header'

		const title = document.createElement('div')
		title.className = 'challenge-title'
		title.innerText = 'Enter the characters you hear.'

		const controls = document.createElement('div')
		controls.className = 'challenge-controls'

		const buttons = [
			{
				icon: icons.reload,
				title: 'New challenge',
				action: () => {
					const button = controls.children[0]
					button.classList.add('loading')

					this.newAudioChallenge(popup.triggerContainer, popup.config).finally(() => {
						button.classList.remove('loading')
					})
				}
			},
			{
				icon: icons.image,
				title: 'Image challenge',
				action: () => {
					const button = controls.children[1]
					button.classList.add('loading')

					if (
						this.ui.imageChallenge.currentImageChallenge &&
						this.ui.imageChallenge.currentImageChallenge.images
					) {
						button.classList.remove('loading')
						this.ui.showChallengeView(popup)
					} else {
						this.ui.imageChallenge
							.newImageChallenge(popup.triggerContainer, popup.config)
							.finally(() => {
								button.classList.remove('loading')
								this.ui.showChallengeView(popup)
							})
					}
				}
			},
			{ icon: icons.info, title: 'Information', action: () => this.ui.showInfoView(popup) }
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

		header.appendChild(title)
		header.appendChild(controls)
		exampleSection.appendChild(header)
		soundChallengeView.appendChild(exampleSection)

		const soundChallengeContainer = document.createElement('div')
		soundChallengeContainer.className = 'sound-challenge-container'

		const audioContainer = document.createElement('div')
		audioContainer.className = 'audio-container'

		const audioPlayer = document.createElement('audio')
		audioPlayer.controls = true
		audioPlayer.className = 'audio-player'

		audioContainer.appendChild(audioPlayer)
		soundChallengeContainer.appendChild(audioContainer)

		const inputContainer = document.createElement('div')
		inputContainer.className = 'sound-input-container'

		const inputField = document.createElement('input')
		inputField.type = 'text'
		inputField.className = 'sound-input-field'
		inputField.placeholder = 'Type the characters you hear'
		inputField.setAttribute('aria-label', 'Type the characters you hear')
		inputField.value = this.currentAudioInput

		inputField.addEventListener('input', (event) => {
			this.currentAudioInput = event.target.value
			verifyButton.disabled = this.currentAudioInput.trim() === ''
		})

		inputContainer.appendChild(inputField)
		soundChallengeContainer.appendChild(inputContainer)
		soundChallengeView.appendChild(soundChallengeContainer)

		const verifyButton = document.createElement('button')
		verifyButton.className = 'verify-button'
		verifyButton.textContent =
			this.currentAudioChallengeIndex < this.totalAudioChallenges - 1 ? 'NEXT' : 'VERIFY'
		verifyButton.disabled = !this.currentAudioInput.trim()

		verifyButton.addEventListener('click', () => {
			const overlay = this.ui.activePopup.querySelector('.progress-overlay')
			const overlayText = overlay.querySelector('.progress-overlay-text')
			const overlayFill = overlay.querySelector('.progress-overlay-fill')

			overlay.classList.add('active')

			if (this.currentAudioChallengeIndex < this.totalAudioChallenges - 1) {
				overlayText.textContent = `${this.currentAudioChallengeIndex + 1} done`
				const progress =
					((this.currentAudioChallengeIndex + 1) / this.totalAudioChallenges) * 100
				overlayFill.style.width = `${progress}%`

				setTimeout(() => {
					overlay.classList.remove('active')
					this.currentAudioChallengeIndex++
					this.currentAudioInput = ''
					this.updateExistingAudioPopup(this.currentAudioChallenge)
				}, 1000)
			} else {
				overlayText.textContent = `${this.totalAudioChallenges} done`
				overlayFill.style.width = '100%'

				setTimeout(() => {
					this.handleAudioVerification(popup.triggerContainer, popup)
				}, 1000)
			}
		})

		soundChallengeView.appendChild(verifyButton)

		return soundChallengeView
	}

	handleAudioVerification(container, popup) {
		try {
			this.ui.pauseAudioIfPlaying(popup)

			if (this.currentAudioPowChallenge && this.currentAudioChallenge) {
				console.log('Audio verification data:', {
					powChallenge: this.currentAudioPowChallenge,
					audioChallenge: this.currentAudioChallenge,
					userInput: this.currentAudioInput
				})
			}

			popup.classList.remove('active')
			this.currentAudioInput = ''
			this.currentAudioChallengeIndex = 0

			const checkbox = container.querySelector('.captcha-checkbox')
			if (checkbox) {
				checkbox.checked = true
			}
		} catch (error) {
			console.error('Audio verification error:', error)
			this.ui.showError(container, 'Failed to verify audio challenge')
		}
	}
}
