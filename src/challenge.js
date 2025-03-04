const WORKERS_COUNT = Math.min(navigator.hardwareConcurrency || 4, 8)
const WORKER_SCRIPT = ``

async function solve_pow_challenge(challenge) {
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

async function initialRequest(url, siteKey) {
	const headers = siteKey ? { 'Librecap-Site-Key': siteKey } : {}
	try {
		const response = await fetch(url + '/initial', { headers })
		if (!response.ok) {
			throw new Error(`Server returned ${response.status}: ${response.statusText}`)
		}

		const bufferData = await response.arrayBuffer()
		const challenges = parsePowChallengesBuffer(bufferData)

		return challenges
	} catch (error) {
		throw new Error(
			`The server is not available. Please provide an valid site key or server url. Try again later.`
		)
	}
}

async function challengeRequest(url, siteKey, challenge, solution) {
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

	const responseText = await response.text()

	if (!response.ok) {
		throw new Error(`Server returned ${response.status}: ${responseText}`)
	}

	console.log('FIXME: response should be parsed for subject and images')

	return responseText
}
