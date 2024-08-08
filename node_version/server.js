const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware to log all incoming requests
app.use((req, res, next) => {
	console.log(`Received request for ${req.url}`);
	next();
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Test route
app.get('/test', (req, res) => {
	console.log('Received request at /test');
	res.json({ message: 'Test route working!' });
});

// Health check route
app.get('/health', (req, res) => {
	console.log('Received request at /health');
	res.json({ status: 'Server is healthy' });
});

app.get('/env', (req, res) => {
	const envData = {
		clientId: process.env.CLIENT_ID,
		apiKey: process.env.API_KEY
	};
	console.log('Environment Variables:', envData);
	res.json(envData);
});

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all route to serve index.html for any other routes (for a single-page app)
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app; // Export the app for Vercel
