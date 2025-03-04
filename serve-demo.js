const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())

app.use(express.static(path.join(__dirname)))

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'demo.html'))
})

app.get('/dist/librecap-min.js', (req, res) => {
	res.sendFile(path.join(__dirname, 'dist/librecap-min.js'))
})

app.get('/librecap/v1/initial', (req, res) => {
	// Demo route sending fake challenges
	const buffer = Buffer.alloc(114)

	const fillRandomBytes = (start, length) => {
		for (let i = 0; i < length; i++) {
			buffer[start + i] = Math.floor(Math.random() * 256)
		}
	}

	fillRandomBytes(0, 16)
	const timestamp1 = BigInt(Date.now())
	buffer.writeBigUInt64BE(timestamp1, 16)

	buffer[24] = 20
	fillRandomBytes(25, 32)

	fillRandomBytes(57, 16)
	const timestamp2 = BigInt(Date.now())
	buffer.writeBigUInt64BE(timestamp2, 73)

	buffer[81] = 22
	fillRandomBytes(82, 32)

	res.set('Content-Type', 'application/octet-stream')
	res.send(buffer)
})

app.post('/librecap/v1/challenge', (req, res) => {
	res.send('ok')
})

app.listen(PORT, () => {
	console.log(`Demo server running at http://localhost:${PORT}`)
})
