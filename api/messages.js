// api/messages.js

const { kv } = require('@vercel/kv');

// Handler untuk GET dan POST
module.exports = async (req, res) => {
    try {
        if (req.method === 'GET') {
            // Ambil semua pesan dari KV
            const messagesList = await kv.lrange('messages', 0, -1);
            const messages = messagesList.map(msg => JSON.parse(msg));
            
            // Filter pesan dalam 24 jam terakhir
            const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
            const recentMessages = messages.filter(msg => new Date(msg.timestamp).getTime() > twentyFourHoursAgo);
            
            res.status(200).json(recentMessages);

        } else if (req.method === 'POST') {
            const newMessage = { ...req.body, timestamp: new Date().toISOString() };
            
            // Simpan pesan baru ke dalam list 'messages' di KV
            await kv.lpush('messages', JSON.stringify(newMessage));
            
            // Opsional: Hapus pesan-pesan lama jika list terlalu panjang untuk mencegah pembengkakan
            // KV tidak memiliki TTL per-item, jadi kita lakukan cleanup manual
            const allMessages = await kv.lrange('messages', 0, -1);
            const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
            const validMessages = allMessages.filter(msg => new Date(JSON.parse(msg).timestamp).getTime() > cutoffTime);
            
            // Jika ada pesan yang dihapus, tulis ulang listnya
            if (validMessages.length < allMessages.length) {
                await kv.del('messages');
                if (validMessages.length > 0) {
                    await kv.lpush('messages', ...validMessages);
                }
            }

            res.status(201).json(newMessage);

        } else {
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Error di /api/messages:', error);
        res.status(500).json({ error: 'Gagal memproses permintaan', details: error.message });
    }
};
