// api/cleanup.js
const fs = require('fs').promises;
const path = require('path');

const dataPath = path.join(__dirname, 'data.json');

module.exports = async (req, res) => {
    if (req.method !== 'POST') { // Cron job biasanya menggunakan POST
        return res.status(405).end('Method Not Allowed');
    }
    
    try {
        const messages = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        const filteredMessages = messages.filter(msg => new Date(msg.timestamp).getTime() > twentyFourHoursAgo);
        
        await fs.writeFile(dataPath, JSON.stringify(filteredMessages, null, 2));
        
        console.log(`Cleanup berhasil. Dihapus ${messages.length - filteredMessages.length} pesan lama.`);
        res.status(200).json({ message: 'Cleanup successful' });

    } catch (error) {
        console.error("Cleanup failed:", error);
        res.status(500).json({ error: 'Cleanup failed' });
    }
};
