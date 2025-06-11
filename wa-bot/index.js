const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const axios = require('axios');
const express = require('express');
const cors = require('cors'); // Import the cors package
const path = require('path');

const appServer = express();
const PORT = 5001;

// --- Start of Changes ---

// Enable CORS for requests from your frontend
appServer.use(cors({
  origin: 'http://frontend:3000' // Allow your React app's origin
}));

let latestQR = '';
let waStatus = 'Initializing... Please wait.';
let isConnected = false;

// API endpoint to get the QR code and status
appServer.get('/api/qr', (req, res) => {
    res.json({
        qrDataURL: latestQR,
        status: waStatus,
        connected: isConnected
    });
});

// Remove the old HTML page route
/*
appServer.get('/wa', (req, res) => {
    const html = `...`; // This is no longer needed
    res.send(html);
});
*/

appServer.listen(PORT, () => {
    console.log(`🌐 WA Bot Server with API running at http://localhost:${PORT}`);
});

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});


const greetedUsers = new Set();

client.on('qr', async (qr) => {
    try {
        latestQR = await qrcode.toDataURL(qr);
        waStatus = 'QR Code Ready. Please scan.';
        isConnected = false;
        console.log('🔁 QR Code has been updated.');
    } catch (err) {
        console.error('QR encode error:', err.message);
    }
});

client.once('ready', () => {
    waStatus = 'WhatsApp client is connected and ready!';
    isConnected = true;
    latestQR = ''; // Clear the QR code once connected
    console.log('✅ WhatsApp client is ready!');
});

client.on('disconnected', (reason) => {
    waStatus = `Client disconnected: ${reason}. Please refresh to get a new QR code.`;
    isConnected = false;
    console.warn(`⚠️ WhatsApp client disconnected: ${reason}`);
});

// --- End of Changes ---

client.on('message_create', async (message) => {
    if (message.fromMe || message.from.includes('@g.us')) return;

    const userId = message.from;
    const rawMessage = message.body.trim();
    if (!rawMessage) return;

    if (!greetedUsers.has(userId)) {
        const greeting = `👋 Halo! Selamat datang di *Catty - Chatbot Teknologi Informasi ITS* 📡✨

Saya adalah asisten AI yang siap membantu kamu mendapatkan informasi seputar *Departemen Teknologi Informasi ITS*.

*Tanya apa saja, Catty siap bantu!* 📩`;

        await client.sendMessage(userId, greeting);
        greetedUsers.add(userId);
        return;
    }

    try {
        const chat = await message.getChat();
        await chat.sendStateTyping();
        await new Promise(resolve => setTimeout(resolve, 3000));

        const response = await axios.post('http://app:5000/api/chat', {
            message: rawMessage,
            role: 'general'
        }, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        const reply = response.data.answer || 'Maaf, tidak ada jawaban yang ditemukan.';
        await client.sendMessage(userId, reply);

    } catch (error) {
        console.error("❌ Gagal proses:", error.message);
        await client.sendMessage(userId, '❌ Terjadi kesalahan saat menghubungi server AI. Silakan coba lagi nanti.');
    }
});

client.initialize();