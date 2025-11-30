// api/messages.js
const fs = require('fs').promises;
const path = require('path');

const dataPath = path.join(__dirname, 'data.json');

// Helper function untuk membaca data
const readData = async () => {
    const data = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(data);
};

// Helper function untuk menulis data
const writeData = async (data) => {
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
};

// Handler untuk GET dan POST
module.exports = async (req, res) => {
    try {
        if (req.method === 'GET') {
            const messages = await readData();
            // Filter pesan dalam 24 jam terakhir
            const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
            const recentMessages = messages.filter(msg => new Date(msg.timestamp).getTime() > twentyFourHoursAgo);
            res.status(200).json(recentMessages);

        } else if (req.method === 'POST') {
            const newMessage = { ...req.body, timestamp: new Date().toISOString() };
            const messages = await readData();
            messages.push(newMessage);
            await writeData(messages);
            res.status(201).json(newMessage);

        } else {
            // Menangani metode lain yang tidak diizinkan
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        res.status(500).json({ error: 'Gagal memproses permintaan', details: error.message });
    }
};
