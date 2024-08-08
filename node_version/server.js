const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const favicon = require('serve-favicon')
// This is for the freeking warning i keep getting
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
app.use(cookieParser());

app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));

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

// app.listen(3000)
module.exports = app;
