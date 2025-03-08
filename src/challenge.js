const WORKERS_COUNT = Math.min(navigator.hardwareConcurrency || 4, 8)
const WORKER_SCRIPT = ``

export async function solve_pow_challenge(challenge) {
	return new Promise((resolve, reject) => {
		const activeWorkers = []

		function stopAllWorkers() {
			for (const worker of activeWorkers) {
				worker.terminate()
			}
			activeWorkers.length = 0
		}

		for (let i = 0; i < WORKERS_COUNT; i++) {
			const worker = new Worker('data:text/javascript,' + encodeURIComponent(WORKER_SCRIPT))
			activeWorkers.push(worker)

			const startValue = BigInt(i) * (BigInt(Number.MAX_SAFE_INTEGER) / BigInt(WORKERS_COUNT))

			worker.onmessage = function (e) {
				const data = e.data
				if (data.solution) {
					stopAllWorkers()
					resolve(data.solution)
				} else if (data.type === 'error') {
					reject(new Error(data.error))
				}
			}

			worker.onerror = function (error) {
				reject(new Error(`Worker ${i} error: ${error.message}`))
			}

			worker.postMessage({
				type: 'solve',
				challenge: challenge,
				hardness: challenge.hardness,
				startValue: startValue
			})
		}
	})
}

class PowChallenge {
	constructor(nonce, timestamp, signature, hardness) {
		this.nonce = nonce
		this.timestamp = timestamp
		this.signature = signature
		this.hardness = hardness
	}
}

class ImageCaptchaChallenge {
	constructor(nonce, timestamp, signature, indicesHash, images) {
		this.nonce = nonce
		this.timestamp = timestamp
		this.signature = signature
		this.indicesHash = indicesHash
		this.images = images
	}
}

function parsePowChallengesBuffer(buffer) {
	try {
		const data = new Uint8Array(buffer)

		const firstNonce = data.slice(0, 16)
		const firstTimestamp = data.slice(16, 24)
		const firstHardness = data[24]
		const firstSignature = data.slice(25, 57)

		const secondNonce = data.slice(57, 73)
		const secondTimestamp = data.slice(73, 81)
		const secondHardness = data[81]
		const secondSignature = data.slice(82)

		return {
			first: new PowChallenge(firstNonce, firstTimestamp, firstSignature, firstHardness),
			second: new PowChallenge(secondNonce, secondTimestamp, secondSignature, secondHardness)
		}
	} catch (error) {
		console.error('Error parsing POW challenges buffer:', error)
		return null
	}
}

function splitByteArrays(buffer) {
	const view = new DataView(buffer)
	const arrays = []
	let pos = 0

	while (pos + 4 <= buffer.byteLength) {
		const length = view.getUint32(pos, false)
		pos += 4

		if (pos + length > buffer.byteLength) {
			throw new Error('Buffer is truncated')
		}

		const array = new Uint8Array(buffer, pos, length)
		arrays.push(array)
		pos += length
	}

	if (pos !== buffer.byteLength) {
		throw new Error('Buffer contains extra bytes')
	}

	return arrays
}

function parseImageCaptchaChallengesBuffer(buffer) {
	try {
		const data = new Uint8Array(buffer)

		const nonce = data.slice(0, 16)
		const timestamp = data.slice(16, 24)
		const signature = data.slice(24, 56)
		const indicesHash = data.slice(56, 88)
		const imagesData = data.slice(88)
		const images = splitByteArrays(
			imagesData.buffer.slice(
				imagesData.byteOffset,
				imagesData.byteOffset + imagesData.byteLength
			)
		)

		return new ImageCaptchaChallenge(nonce, timestamp, signature, indicesHash, images)
	} catch (error) {
		console.error('Error parsing image captcha challenges buffer:', error)
		return null
	}
}

function generatePowSolutionBuffer(pow_challenge, solution) {
	try {
		const buffer = new Uint8Array(65)
		buffer.set(pow_challenge.nonce, 0)

		const timestampArray = new Uint8Array(pow_challenge.timestamp)
		const timestampValue = new DataView(timestampArray.buffer).getBigUint64(0, false)
		const timestampView = new DataView(buffer.buffer, 16, 8)
		timestampView.setBigUint64(0, timestampValue, false)

		buffer[24] = pow_challenge.hardness
		buffer.set(pow_challenge.signature, 25)
		buffer.set(solution, 57)

		return buffer
	} catch (error) {
		console.error('Error generating POW solution buffer:', error)
		return null
	}
}

export async function initialRequest(url, siteKey) {
	const headers = siteKey ? { 'Librecap-Site-Key': siteKey } : {}
	try {
		const response = await fetch(url + '/initial', { headers })
		if (!response.ok) {
			throw new Error(`Server returned ${response.status}: ${response.statusText}`)
		}

		const bufferData = await response.arrayBuffer()
		const challenges = parsePowChallengesBuffer(bufferData)

		return challenges
	} catch {
		throw new Error(
			`The server is not available. Please provide an valid site key or server url. Try again later.`
		)
	}
}

export async function challengeRequest(url, siteKey, challenge, solution) {
	const powSolutionBuffer = generatePowSolutionBuffer(challenge, solution)

	if (!powSolutionBuffer) {
		throw new Error('Error generating POW solution buffer')
	}

	const headers = siteKey
		? { 'Content-Type': 'application/octet-stream', 'Librecap-Site-Key': siteKey }
		: { 'Content-Type': 'application/octet-stream' }

	const response = await fetch(url + '/challenge', {
		method: 'POST',
		headers,
		body: powSolutionBuffer
	})

	if (!response.ok) {
		throw new Error(`Server returned ${response.status}: ${response.statusText}`)
	}

	const bufferData = await response.arrayBuffer()
	const challenges = parseImageCaptchaChallengesBuffer(bufferData)

	return challenges
}
