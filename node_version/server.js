const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();


app.use(express.static(path.join(__dirname, 'public')));


app.get('/env', (req, res) => {
	const envData = {
		clientId: process.env.CLIENT_ID,
		apiKey: process.env.API_KEY
	};
	res.json(envData);
});

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000)
module.exports = app;

