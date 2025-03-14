export class ImageChallenge {
	constructor(ui) {
		this.ui = ui
		this.selectedImages = new Set()
		this.currentImagePowChallenge = null
		this.currentImageChallenge = null
		this.currentImageChallengeIndex = 0
		this.totalImageChallenges = 1
		this.selectedImagesPerChallenge = []
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

	async newImageChallenge(container, config) {
		try {
			const powChallenges = await this.ui.initialRequest(config.apiEndpoint, config.siteKey)
			const powSolution = await this.ui.solve_pow_challenge(powChallenges.first)
			const imageChallenge = await this.ui.challengeRequest(
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

			if (this.ui.activePopup) {
				this.updateExistingPopup(imageChallenge)
			} else {
				this.createChallengePopup(container, imageChallenge, config)
			}
		} catch (error) {
			console.error('Challenge error:', error)
			this.ui.showError(container, error.message || 'Failed to load challenge')
			container.classList.remove('loading')
		}
	}

	updateExistingPopup(imageChallenge) {
		const progressIndicator = this.ui.activePopup.querySelector('.challenge-progress')
		if (progressIndicator) {
			progressIndicator.textContent = `Challenge ${this.currentImageChallengeIndex + 1} of ${this.totalImageChallenges}`
		}

		const exampleImage = this.ui.activePopup.querySelector('.example-image img')
		if (exampleImage) {
			const img = this.createImageElement(imageChallenge.images[0])
			exampleImage.parentNode.replaceChild(img, exampleImage)
		}

		const grid = this.ui.activePopup.querySelector('.challenge-grid')
		const verifyButton = this.ui.activePopup.querySelector('.verify-button')
		if (grid && verifyButton) {
			this.updateGrid(grid, imageChallenge, 0, verifyButton)
		}

		if (this.ui.currentView === 'info') {
			this.ui.showChallengeView(this.ui.activePopup)
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

		const progressIndicator = this.ui.activePopup.querySelector('.challenge-progress')
		if (progressIndicator) {
			progressIndicator.textContent = `Challenge ${challengeIndex + 1} of ${this.totalImageChallenges}`
		}
	}

	handleVerification(container, popup) {
		try {
			this.ui.pauseAudioIfPlaying(popup)

			if (this.currentImagePowChallenge && this.currentImageChallenge) {
				const selectedImagesData = this.selectedImagesPerChallenge.map((set, index) => ({
					challenge: index + 1,
					selectedIndexes: Array.from(set)
				}))

				console.log('Verification data:', {
					powChallenge: this.currentImagePowChallenge,
					imageChallenge: this.currentImageChallenge,
					selectedImages: selectedImagesData
				})
			}

			popup.classList.remove('active')
			this.selectedImagesPerChallenge = []
			this.currentImageChallengeIndex = 0

			const checkbox = container.querySelector('.captcha-checkbox')
			if (checkbox) {
				checkbox.checked = true
			}
		} catch (error) {
			console.error('Verification error:', error)
			this.ui.showError(container, 'Failed to verify challenge')
		}
	}
}
