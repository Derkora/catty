const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const axios = require('axios');
const express = require('express');
const path = require('path');

const appServer = express();
const PORT = 5001;

let latestQR = '';
let waStatus = 'Not connected';

appServer.get('/wa', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>QR WhatsApp Bot</title>
        <style>
            body { font-family: sans-serif; background: #f9f9f9; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
            img { border: 1px solid #ccc; padding: 10px; background: #fff; border-radius: 8px; }
            .status { margin-top: 20px; font-size: 1.2em; color: #333; }
        </style>
    </head>
    <body>
        <h2>Scan QR WhatsApp</h2>
        ${latestQR ? `<img src="${latestQR}" alt="QR Code" />` : '<p>QR belum tersedia.</p>'}
        <div class="status"><h3>Status: ${waStatus}</h3></div>
    </body>
    </html>`;
    res.send(html);
});

appServer.listen(PORT, () => {
    console.log(`🌐 QR HTML Server running at http://localhost:${PORT}/wa`);
});

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: '/usr/bin/google-chrome', // <-- tambahkan ini
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});


const greetedUsers = new Set();

client.on('qr', async (qr) => {
    try {
        latestQR = await qrcode.toDataURL(qr);  // <-- disimpan lokal
        waStatus = 'QR tersedia, belum scan';
        console.log('🔁 QR updated');
    } catch (err) {
        console.error('QR encode error:', err.message);
    }
});

client.once('ready', () => {
    waStatus = 'Connected';
    console.log('✅ WhatsApp client is ready!');
});

client.on('disconnected', (reason) => {
    waStatus = `Disconnected: ${reason}`;
    console.warn(`⚠️ WhatsApp client disconnected: ${reason}`);
});


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

        // 🔴 Kirim status "typing..."
        await chat.sendStateTyping();

        // Simulasi delay seperti manusia mengetik
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Kirim pertanyaan ke backend
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
