const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const axios = require('axios');

// Buat client WhatsApp dengan LocalAuth
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './auth'
    }),
    puppeteer: {
        headless: true,  // atau false jika ingin lihat browser
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920x1080'
        ]
    }
});

// In-memory user greeting state
const greetedUsers = new Set();

// Event QR muncul
client.on('qr', async (qr) => {
    try {
        const qrDataURL = await qrcode.toDataURL(qr);
        console.log("📨 Mengirim QR ke backend Flask...");
        await axios.post('http://localhost:5001/qr', { qr: qrDataURL }); // Gunakan localhost
    } catch (err) {
        console.error("❌ Gagal kirim QR:", err.message);
    }
});

// Client siap digunakan
client.once('ready', async () => {
    console.log('✅ WhatsApp client is ready!');
    try {
        await axios.post('http://localhost:5001/status', { status: 'connected' });
    } catch (err) {
        console.error("❌ Gagal kirim status ke Flask:", err.message);
    }
});

// Tangani pesan masuk
client.on('message_create', async (message) => {
    if (message.fromMe || message.isGroupMsg) return;

    const userId = message.from;
    const rawMessage = message.body.trim();
    const lowered = rawMessage.toLowerCase();

    if (!greetedUsers.has(userId)) {
        const greeting = `👋 Halo! Saya adalah asisten AI DTI ITS.\n\nKetik *!ask pertanyaan* untuk mulai bertanya.`;
        await client.sendMessage(userId, greeting);
        greetedUsers.add(userId);
        return;
    }

    let question = "";
    if (lowered.startsWith("!ask ")) {
        question = rawMessage.slice(5).trim();
    }

    if (!question) return;

    try {
        const response = await axios.post('http://localhost:5000/chat', {
            message: question,
            role: 'general',
            use_rag: true
        });

        const reply = response.data.reply || 'Maaf, tidak ada jawaban.';
        await client.sendMessage(userId, reply);

    } catch (error) {
        console.error("❌ Gagal kirim ke backend:", error.message);
        await client.sendMessage(userId, '❌ Terjadi kesalahan saat menghubungi server AI.');
    }
});

// Jalankan client
client.initialize();
