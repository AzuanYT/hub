// api/spotify/search.js
const axios = require('axios');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).end('Method Not Allowed');
    }

    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Query pencarian diperlukan' });
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
        // Di serverless, kita tidak cache token. Kita fetch setiap kali untuk kesederhanaan.
        const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', {
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const token = tokenResponse.data.access_token;

        const searchResponse = await axios.get(`https://api.spotify.com/v1/search`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { q: query, type: 'track', limit: 5 }
        });

        const tracks = searchResponse.data.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            artist: track.artists.map(a => a.name).join(', '),
            albumArt: track.album.images[0]?.url
        }));

        res.status(200).json(tracks);
    } catch (error) {
        console.error("Gagal mencari lagu di Spotify:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Gagal mencari lagu' });
    }
};
