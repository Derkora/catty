const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// Buat client WhatsApp
const client = new Client();

// QR Code
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

// Saat client siap
client.once('ready', () => {
    console.log('✅ WhatsApp client is ready!');
});

// Saat pesan masuk
client.on('message_create', async (message) => {
    // Hindari bot merespons dirinya sendiri
    if (message.fromMe) return;

    const userMessage = message.body.trim();

    // Opsional: Filter awal (misal hanya tanggapi yang diawali dengan !ask)
    if (!userMessage.startsWith('!ask ')) return;

    const question = userMessage.slice(5).trim(); // buang '!ask '

    try {
        // Kirim ke Flask backend
        const response = await axios.post('http://localhost:5000/chat', {
            message: question,
            role: 'general',
            use_rag: true  // true kalau ingin pakai RAG
        });

        const reply = response.data.reply || 'Maaf, tidak ada jawaban.';

        // Kirim balasan ke WhatsApp
        client.sendMessage(message.from, reply);
    } catch (error) {
        console.error("❌ Gagal kirim ke backend:", error.message);
        client.sendMessage(message.from, 'Terjadi kesalahan saat menghubungi server AI.');
    }
});

// Mulai client
client.initialize();
