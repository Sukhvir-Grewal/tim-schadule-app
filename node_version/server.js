const express = require('express')
const path = require('path')
const dotenv = require('dotenv')
dotenv.config()

const app = express()
app.use(express.static('public'))

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, "./index.html"))
})

app.get('/env', (req, res) => {
	const envData = {
		clientId: process.env.CLIENT_ID,
		apiKey: process.env.API_KEY
	};
	console.log('Environment Variables:', envData); // Log the environment variables
	res.json(envData);
})

app.listen(3000, () => { console.log("server started") })

module.exports = app
