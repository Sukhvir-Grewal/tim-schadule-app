const express = require('express');
const path = require('path');

const app = express();
app.use(express.static('public'));

app.get('/env', (req, res) => {
	const envData = {
		clientId: process.env.CLIENT_ID,
		apiKey: process.env.API_KEY
	};
	console.log('Environment Variables:', envData);
	// res.json(envData);
	res.send("esdfsd")
});

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch all route to serve index.html for any other routes (if single-page app)
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app; // Export the app for Vercel
