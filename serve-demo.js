const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 3000

const imageExampleBuffer = fs.readFileSync(path.join(__dirname, 'demo/image.bin'))
const audioExampleBuffer = fs.readFileSync(path.join(__dirname, 'demo/audio.bin'))

function fillRandomBytes(buffer, start, length) {
	for (let i = 0; i < length; i++) {
		buffer[start + i] = Math.floor(Math.random() * 256)
	}
}

app.use(cors())

app.use(express.static(path.join(__dirname)))

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'demo.html'))
})

app.get('/dist/librecap-min.js', (req, res) => {
	res.sendFile(path.join(__dirname, 'dist/librecap-min.js'))
})

app.get('/librecap/v1/initial', (req, res) => {
	const buffer = Buffer.alloc(114)

	fillRandomBytes(buffer, 0, 16)
	const timestamp1 = BigInt(Date.now())
	buffer.writeBigUInt64BE(timestamp1, 16)

	buffer[24] = 20
	fillRandomBytes(buffer, 25, 32)

	fillRandomBytes(buffer, 57, 16)
	const timestamp2 = BigInt(Date.now())
	buffer.writeBigUInt64BE(timestamp2, 73)

	buffer[81] = 22
	fillRandomBytes(buffer, 82, 32)

	res.set('Content-Type', 'application/octet-stream')
	res.send(buffer)
})

function generateDemoChallenge(exampleBuffer) {
	const buffer = Buffer.alloc(88 + exampleBuffer.length)

	fillRandomBytes(buffer, 0, 16)
	const timestamp1 = BigInt(Date.now())
	buffer.writeBigUInt64BE(timestamp1, 16)

	fillRandomBytes(buffer, 24, 64)
	exampleBuffer.copy(buffer, 88)

	return buffer
}

app.post('/librecap/v1/challenge', (req, res) => {
	const buffer = generateDemoChallenge(imageExampleBuffer)

	res.set('Content-Type', 'application/octet-stream')
	res.send(buffer)
})

app.post('/librecap/v1/audio_challenge', (req, res) => {
	const buffer = generateDemoChallenge(audioExampleBuffer)

	res.set('Content-Type', 'application/octet-stream')
	res.send(buffer)
})

app.listen(PORT, () => {
	console.log(`Demo server running at http://localhost:${PORT}`)
})
