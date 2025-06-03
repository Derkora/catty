const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const axios = require('axios');

// Buat client WhatsApp dengan LocalAuth
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// In-memory user greeting state
const greetedUsers = new Set();

// Saat QR code muncul
client.on('qr', async (qr) => {
    try {
        const qrDataURL = await qrcode.toDataURL(qr);
        console.log("📨 Mengirim QR ke backend Flask...");

        await axios.post('http://flask:5001/qr', { qr: qrDataURL });
    } catch (err) {
        console.error("❌ Gagal kirim QR:", err.message);
    }
});

// Saat client siap
client.once('ready', async () => {
    console.log('✅ WhatsApp client is ready!');

    try {
        await axios.post('http://flask:5001/status', { status: 'connected' });
    } catch (err) {
        console.error("❌ Gagal kirim status ke Flask:", err.message);
    }
});

// Saat client disconnect (logout, koneksi putus, dsb)
client.on('disconnected', async (reason) => {
    console.warn(`⚠️ WhatsApp client disconnected: ${reason}`);

    try {
        await axios.post('http://flask:5001/status', { status: 'disconnected' });
    } catch (err) {
        console.error("❌ Gagal kirim status disconnect ke Flask:", err.message);
    }
});

// Saat pesan masuk
client.on('message_create', async (message) => {
    if (message.fromMe || message.from.includes('@g.us')) return;

    const userId = message.from;
    const rawMessage = message.body.trim();

    if (!rawMessage) return;

    // Greeting awal
    if (!greetedUsers.has(userId)) {
        const greeting = `👋 Halo! Selamat datang di *Catty - Chatbot Teknologi Informasi ITS* 📡✨

Saya adalah asisten AI yang siap membantu kamu mendapatkan informasi seputar *Departemen Teknologi Informasi ITS*.

*Tanya apa saja, Catty siap bantu!* 📩`;

        await client.sendMessage(userId, greeting);
        greetedUsers.add(userId);
        return;
    }

    let typingInterval;

    try {
        // Mulai loop "typing"
        typingInterval = setInterval(() => {
            client.sendTyping(userId);
        }, 4000); // kirim typing setiap 4 detik

        // Kirim pertanyaan ke backend
        const response = await axios.post('http://10.4.89.48:5000/api/chat', {
            message: rawMessage,
            role: 'general'
        }, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        const reply = response.data.answer || 'Maaf, tidak ada jawaban yang ditemukan.';
        await client.sendMessage(userId, reply);

    } catch (error) {
        console.error("❌ Gagal kirim ke backend:", error.message);
        await client.sendMessage(userId, '❌ Terjadi kesalahan saat menghubungi server AI. Silakan coba lagi nanti.');
    } finally {
        // Hentikan loop typing
        if (typingInterval) clearInterval(typingInterval);
    }
});

// Inisialisasi client
client.initialize();
