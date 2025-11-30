// public/script.js

const API_URL = ''; // Kosongkan karena frontend dan backend di domain yang sama (Vercel)

let allMessages = [];
let selectedTrack = null; // Untuk menyimpan lagu yang dipilih

// --- Fetch and Filter Data ---
async function fetchData() {
    try {
        const response = await fetch(`${API_URL}/api/messages`);
        if (!response.ok) {
            throw new Error("Gagal mengambil pesan dari server");
        }
        allMessages = await response.json();
        renderMessages(allMessages);
    } catch (error) {
        console.error("Failed to fetch messages:", error);
        const messageList = document.getElementById('messageList');
        messageList.innerHTML = `<p>Gagal memuat pesan. Pastikan server backend berjalan.</p>`;
    }
}

// --- Page Navigation ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const targetBtn = document.querySelector(`.nav-btn[onclick="showPage('${pageId}')"]`);
    if(targetBtn) targetBtn.classList.add('active');
}

// --- Render Message Cards ---
function renderMessages(messages) {
    const messageList = document.getElementById('messageList');
    messageList.innerHTML = '';

    if (messages.length === 0) {
        messageList.innerHTML = "<p>Belum ada pesan baru dalam 24 jam terakhir.</p>";
        return;
    }

    messages.forEach(msg => {
        const card = document.createElement('div');
        card.className = 'message-card';
        card.dataset.messageId = msg.id;
        card.dataset.opened = 'false';

        card.innerHTML = `
            <p><strong>Untuk:</strong> ${msg.recipient}</p>
            <p class="placeholder-text">Klik untuk baca pesan...</p>
            <div class="message-teaser">"${msg.content.substring(0, 50)}..."</div>
            <a href="#" class="read-more-link">Baca Selengkapnya →</a>
            <div class="meta">
                <span class="sender-anon">${msg.is_anon ? 'Anonim' : msg.sender}</span>
                <span class="views">👁️ ${msg.views || 0}x</span>
            </div>
        `;
        messageList.appendChild(card);
    });
}

// --- Handle Card Clicks ---
document.addEventListener('click', function(event) {
    const card = event.target.closest('.message-card');
    if (card && !event.target.classList.contains('read-more-link')) {
        const isOpened = card.dataset.opened === 'true';
        const teaser = card.querySelector('.message-teaser');
        const readMoreLink = card.querySelector('.read-more-link');
        const placeholder = card.querySelector('.placeholder-text');

        if (!isOpened) {
            card.dataset.opened = 'true';
            card.classList.add('open');
            placeholder.style.display = 'none';
            teaser.style.display = 'block';
            readMoreLink.style.display = 'inline-block';
        } else {
            card.dataset.opened = 'false';
            card.classList.remove('open');
            placeholder.style.display = 'block';
            teaser.style.display = 'none';
            readMoreLink.style.display = 'none';
        }
    }

    if (event.target.classList.contains('read-more-link')) {
        event.preventDefault();
        const card = event.target.closest('.message-card');
        const messageId = parseInt(card.dataset.messageId, 10);
        showDetailPage(messageId);
    }
});

// --- Show Detail Page ---
function showDetailPage(messageId) {
    const message = allMessages.find(msg => msg.id === messageId);
    if (!message) return;

    const detailCard = document.getElementById('detailCard');
    const formattedDate = new Date(message.timestamp).toLocaleString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    let spotifyPlayerHtml = '';
    if (message.spotify_track_id) {
        spotifyPlayerHtml = `
            <div class="detail-item">
                <strong>Lagu:</strong>
                <div style="margin-top: 10px;">
                    <iframe src="https://open.spotify.com/embed/track/${message.spotify_track_id}?utm_source=generator&theme=0" 
                            width="100%" height="152" frameBorder="0" allowfullscreen="" 
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                            loading="lazy"></iframe>
                </div>
            </div>
        `;
    }

    detailCard.innerHTML = `
        <h2>Pesan Untuk: ${message.recipient}</h2>
        <div class="detail-item">
            <strong>Dari:</strong> ${message.is_anon ? 'Anonim' : message.sender}
        </div>
        <div class="detail-item">
            <strong>Pesan:</strong>
            <div class="message-content">"${message.content}"</div>
        </div>
        ${spotifyPlayerHtml}
        <div class="meta-info">
            <span>Dikirim pada: ${formattedDate}</span>
            <span class="views">👁️ Dilihat ${message.views || 0} kali</span>
        </div>
         <button class="share-btn" onclick="alert('Link disalin! (simulasi)')">Bagikan Link</button>
    `;
    showPage('detail-page');
}

// --- FOMO Counter ---
function updateCounter() {
    const counter = document.getElementById('messageCounter');
    let currentCount = parseInt(counter.innerText.replace('.', ''));
    currentCount += Math.floor(Math.random() * 3) + 1;
    counter.innerText = currentCount.toLocaleString('id-ID');
}
setInterval(updateCounter, 7000);

// --- Form Logic ---
function toggleSenderName() {
    const checkbox = document.getElementById('anonymousCheck');
    const senderInput = document.getElementById('sender');
    senderInput.disabled = checkbox.checked;
    if (checkbox.checked) {
        senderInput.style.backgroundColor = '#f0f0f0';
    } else {
        senderInput.style.backgroundColor = '#fff';
    }
}

// --- Spotify Search Logic ---
const songSearchInput = document.getElementById('songSearch');
const songSearchResults = document.getElementById('songSearchResults');
let searchTimeout;

songSearchInput.addEventListener('input', () => {
    const query = songSearchInput.value;
    if (query.length < 2) {
        songSearchResults.innerHTML = '';
        selectedTrack = null; // Reset selected track if input is cleared
        return;
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`${API_URL}/api/spotify/search?q=${encodeURIComponent(query)}`);
            const tracks = await response.json();
            renderSearchResults(tracks);
        } catch (error) {
            console.error("Gagal mencari lagu:", error);
        }
    }, 300);
});

function renderSearchResults(tracks) {
    songSearchResults.innerHTML = '';
    if (tracks.length === 0) {
        songSearchResults.innerHTML = '<p>Lagu tidak ditemukan.</p>';
        return;
    }
    tracks.forEach(track => {
        const item = document.createElement('div');
        item.className = 'song-result-item';
        item.innerHTML = `
            <img src="${track.albumArt}" alt="${track.name}">
            <div class="song-info">
                <strong>${track.name}</strong>
                <span>${track.artist}</span>
            </div>
        `;
        item.addEventListener('click', () => selectTrack(track));
        songSearchResults.appendChild(item);
    });
}

function selectTrack(track) {
    selectedTrack = track;
    document.getElementById('selectedTrackId').value = track.id;
    songSearchInput.value = `${track.name} - ${track.artist}`;
    songSearchResults.innerHTML = '';
}

document.getElementById('messageForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Mengirim...';

    const formData = {
        recipient: document.getElementById('recipient').value,
        sender: document.getElementById('sender').value,
        content: document.getElementById('messageContent').value,
        spotify_track_id: selectedTrack ? selectedTrack.id : null,
        is_anon: document.getElementById('anonymousCheck').checked
    };
    
    try {
        const response = await fetch(`${API_URL}/api/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Gagal mengirim pesan');
        }

        alert('Pesan terkirim! ✨');
        this.reset();
        document.getElementById('anonymousCheck').checked = true;
        toggleSenderName();
        selectedTrack = null;
        songSearchResults.innerHTML = '';
        
        // Reload messages setelah pengiriman berhasil
        fetchData();

    } catch (error) {
        console.error("Error submitting form:", error);
        alert('Terjadi kesalahan, pesan tidak terkirim.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Kirim Pesan ✨';
    }
});
        
document.getElementById('searchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredMessages = allMessages.filter(msg => 
        msg.recipient.toLowerCase().includes(searchTerm)
    );
    renderMessages(filteredMessages);
});

document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});
