// api/messages.js

const fs = require('fs').promises;
const path = require('path');

const dataPath = path.join(__dirname, 'data.json');

// Helper function untuk membaca data
const readData = async () => {
    try {
        const data = await fs.readFile(dataPath, 'utf-8');
        // Pastikan file tidak kosong sebelum di-parse
        if (data.trim() === '') {
            return [];
        }
        return JSON.parse(data);
    } catch (error) {
        // Jika file tidak ada (ENOENT) atau kosong, kembalikan array kosong
        if (error.code === 'ENOENT' || error instanceof SyntaxError) {
            console.log('data.json tidak ditemukan atau kosong, membuat array kosong.');
            return [];
        }
        // Untuk error lain, lempar kembali
        throw error;
    }
};

// Helper function untuk menulis data
const writeData = async (data) => {
    // Menulis data sebagai string JSON yang terformat
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
};

// Handler untuk GET dan POST
module.exports = async (req, res) => {
    try {
        if (req.method === 'GET') {
            const messages = await readData();
            res.status(200).json(messages);

        } else if (req.method === 'POST') {
            const newMessage = { ...req.body, timestamp: new Date().toISOString() };
            const messages = await readData();
            messages.push(newMessage);
            await writeData(messages);
            res.status(201).json(newMessage);

        } else {
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Error di /api/messages:', error); // Tambahkan log untuk debugging
        res.status(500).json({ error: 'Gagal memproses permintaan', details: error.message });
    }
};
