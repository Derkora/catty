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

// Event QR muncul
client.on('qr', async (qr) => {
    try {
        const qrDataURL = await qrcode.toDataURL(qr); // ubah QR jadi base64
        console.log("📨 Mengirim QR ke backend Flask...");

        // Kirim QR ke server Flask (pastikan URL benar)
        await axios.post('http://flask:5001/qr', { qr: qrDataURL });
    } catch (err) {
        console.error("❌ Gagal kirim QR:", err.message);
    }
});

// WhatsApp client siap
client.once('ready', async () => {
    console.log('✅ WhatsApp client is ready!');
    
    // Kirim status terkoneksi ke Flask setelah client siap
    try {
        await axios.post('http://flask:5001/status', { status: 'connected' });
    } catch (err) {
        console.error("❌ Gagal kirim status ke Flask:", err.message);
    }
});

// Tangani pesan masuk
client.on('message_create', async (message) => {
    if (message.fromMe || message.isGroupMsg) return; // ⛔ skip jika dari bot sendiri atau grup

    const userId = message.from;
    const rawMessage = message.body.trim();
    const lowered = rawMessage.toLowerCase();

    // Greeting untuk user baru
    if (!greetedUsers.has(userId)) {
        const greeting = `👋 Halo! Saya adalah asisten AI DTI ITS.\n\nKetik *!ask pertanyaan* untuk mulai bertanya.`;
        await client.sendMessage(userId, greeting);
        greetedUsers.add(userId);
        return; // ⛔ jangan langsung proses pertanyaan
    }

    // Hanya tanggapi jika pakai prefix !ask
    let question = "";
    if (lowered.startsWith("!ask ")) {
        question = rawMessage.slice(5).trim();
    }

    if (!question) return;

    try {
        const response = await axios.post('http://10.4.89.48:5000/api/chat', {
            message: question,
            role: 'general',
            use_rag: true
        }, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        const reply = response.data.answer || 'Maaf, tidak ada jawaban.';
        await client.sendMessage(userId, reply);

    } catch (error) {
        console.error("❌ Gagal kirim ke backend:", error.message);
        await client.sendMessage(userId, '❌ Terjadi kesalahan saat menghubungi server AI.');
    }
});

client.initialize();
