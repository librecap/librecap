const hasherCache = {
	words: null,
	buffer: null,
	resultBuffer: null,
	w: new Array(64)
}

const K = [
	0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
	0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
	0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
	0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
	0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
	0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
	0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
	0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]

const H = [
	0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
]

function sha256(message) {
	let m = message
	if (message instanceof ArrayBuffer || message instanceof Uint8Array) {
		m = arrayBufferToWordArray(message)
	}

	const hashState = H.slice(0)

	const blocks = prepareBlocks(m)

	for (let i = 0; i < blocks.length; i += 16) {
		processBlock(hashState, blocks, i)
	}

	return hashStateToUint8Array(hashState)
}

function arrayBufferToWordArray(buffer) {
	const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
	const wordCount = Math.ceil(bytes.length / 4)

	if (!hasherCache.words || hasherCache.words.length < wordCount) {
		hasherCache.words = new Array(wordCount)
	}

	const words = hasherCache.words

	for (let i = 0; i < wordCount; i++) {
		words[i] = 0
	}

	for (let i = 0; i < bytes.length; i++) {
		words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8)
	}

	return {
		words: words,
		sigBytes: bytes.length
	}
}

function prepareBlocks(message) {
	const words = message.words
	const sigBytes = message.sigBytes

	const blockSizeInBytes = 64

	const blockCount = Math.ceil((sigBytes + 9) / blockSizeInBytes)
	const blockSizeInWords = blockSizeInBytes / 4
	const paddedLength = blockCount * blockSizeInWords

	if (!hasherCache.buffer || hasherCache.buffer.length < paddedLength) {
		hasherCache.buffer = new Array(paddedLength)
	}

	const paddedWords = hasherCache.buffer

	const wordsLength = Math.min(words.length, paddedLength)
	for (let i = 0; i < wordsLength; i++) {
		paddedWords[i] = words[i]
	}

	for (let i = wordsLength; i < paddedLength; i++) {
		paddedWords[i] = 0
	}

	paddedWords[sigBytes >>> 2] |= 0x80 << (24 - (sigBytes % 4) * 8)

	const messageLengthBits = sigBytes * 8
	paddedWords[paddedLength - 1] = messageLengthBits

	if (messageLengthBits > 0xffffffff) {
		paddedWords[paddedLength - 2] = Math.floor(messageLengthBits / 0x100000000)
	}

	return paddedWords
}

function processBlock(state, blocks, offset) {
	let a = state[0]
	let b = state[1]
	let c = state[2]
	let d = state[3]
	let e = state[4]
	let f = state[5]
	let g = state[6]
	let h = state[7]

	const w = hasherCache.w

	for (let i = 0; i < 16; i++) {
		w[i] = blocks[offset + i]
	}

	for (let i = 16; i < 64; i++) {
		const gamma0x = w[i - 15]
		const gamma0 =
			((gamma0x >>> 7) | (gamma0x << 25)) ^
			((gamma0x >>> 18) | (gamma0x << 14)) ^
			(gamma0x >>> 3)

		const gamma1x = w[i - 2]
		const gamma1 =
			((gamma1x >>> 17) | (gamma1x << 15)) ^
			((gamma1x >>> 19) | (gamma1x << 13)) ^
			(gamma1x >>> 10)

		w[i] = (gamma0 + w[i - 7] + gamma1 + w[i - 16]) | 0
	}

	for (let i = 0; i < 64; i += 8) {
		for (let j = 0; j < 8; j++) {
			const index = i + j
			const ch = (e & f) ^ (~e & g)
			const maj = (a & b) ^ (a & c) ^ (b & c)

			const sigma0 =
				((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))

			const sigma1 =
				((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))

			const t1 = (h + sigma1 + ch + K[index] + w[index]) | 0
			const t2 = (sigma0 + maj) | 0

			h = g
			g = f
			f = e
			e = (d + t1) | 0
			d = c
			c = b
			b = a
			a = (t1 + t2) | 0
		}
	}

	state[0] = (state[0] + a) | 0
	state[1] = (state[1] + b) | 0
	state[2] = (state[2] + c) | 0
	state[3] = (state[3] + d) | 0
	state[4] = (state[4] + e) | 0
	state[5] = (state[5] + f) | 0
	state[6] = (state[6] + g) | 0
	state[7] = (state[7] + h) | 0
}

function hashStateToUint8Array(hashState) {
	if (!hasherCache.resultBuffer) {
		hasherCache.resultBuffer = new Uint8Array(32)
	}

	const result = hasherCache.resultBuffer

	for (let i = 0; i < 8; i++) {
		const word = hashState[i]
		const offset = i * 4

		result[offset] = (word >>> 24) & 0xff
		result[offset + 1] = (word >>> 16) & 0xff
		result[offset + 2] = (word >>> 8) & 0xff
		result[offset + 3] = word & 0xff
	}

	return result
}

function hasRequiredLeadingZeros(hash, requiredZeroBits) {
	const fullBytes = Math.floor(requiredZeroBits / 8)
	for (let i = 0; i < fullBytes; i++) {
		if (hash[i] !== 0) return false
	}

	const remainingBits = requiredZeroBits % 8
	if (remainingBits === 0) return true

	const mask = 0xff << (8 - remainingBits)
	return (hash[fullBytes] & mask) === 0
}

async function solveChallenge(challenge, hardness, startValue = 0, batchSize = 50000) {
	const nonce = new Uint8Array(challenge.nonce)
	const timestamp = new Uint8Array(challenge.timestamp)
	const signature = new Uint8Array(challenge.signature)

	const requiredZeroBits = hardness

	let solution = BigInt(startValue)
	let found = false

	const dataBuffer = new Uint8Array(nonce.length + timestamp.length + signature.length + 8)
	dataBuffer.set(nonce, 0)
	dataBuffer.set(timestamp, nonce.length)
	dataBuffer.set(signature, nonce.length + timestamp.length)

	const solutionOffset = nonce.length + timestamp.length + signature.length
	const solutionView = new DataView(dataBuffer.buffer, solutionOffset, 8)

	while (!found) {
		for (let i = 0; i < batchSize; i++) {
			solutionView.setBigUint64(0, solution, false)

			const hash = sha256(dataBuffer)

			if (hasRequiredLeadingZeros(hash, requiredZeroBits)) {
				const solutionBytes = new Uint8Array(8)
				const solutionDataView = new DataView(solutionBytes.buffer)
				solutionDataView.setBigUint64(0, solution, false)

				self.postMessage({
					solution: solutionBytes,
					found: true
				})

				return
			}

			solution = solution + 1n
		}

		await new Promise((resolve) => setTimeout(resolve, 0))
	}
}

self.onmessage = async function (e) {
	if (e.data.type === 'solve') {
		try {
			await solveChallenge(e.data.challenge, e.data.hardness, e.data.startValue || 0)
		} catch (error) {
			self.postMessage({
				type: 'error',
				error: error.toString()
			})
		}
	}
}
