const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const axios = require('axios');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

const greetedUsers = new Set();

client.on('qr', async (qr) => {
    try {
        const qrDataURL = await qrcode.toDataURL(qr);
        console.log("📨 Mengirim QR ke backend Flask...");
        await axios.post('http://flask:5001/qr', { qr: qrDataURL });
    } catch (err) {
        console.error("❌ Gagal kirim QR:", err.message);
    }
});

client.once('ready', async () => {
    console.log('✅ WhatsApp client is ready!');
    try {
        await axios.post('http://flask:5001/status', { status: 'connected' });
    } catch (err) {
        console.error("❌ Gagal kirim status ke Flask:", err.message);
    }
});

client.on('disconnected', async (reason) => {
    console.warn(`⚠️ WhatsApp client disconnected: ${reason}`);
    try {
        await axios.post('http://flask:5001/status', { status: 'disconnected' });
    } catch (err) {
        console.error("❌ Gagal kirim status disconnect ke Flask:", err.message);
    }
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
