// ===========================
// RSA Demo Application
// ===========================

// Global State
const state = {
    alicePublicKey: null,
    bobPublicKey: null,
    aliceEncryptedMessage: null,
    bobEncryptedMessage: null,
    serverConnected: false
};

// API Configuration
const API_URL = 'http://localhost:5000';

// ===========================
// Initialization
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

async function initializeApp() {
    try {
        // Check server connection
        await checkServerConnection();

        // Initialize keys
        await initializeKeys();

        // Update UI
        updateConnectionStatus(true);
        showToast('Connexion au serveur RSA établie', 'success');
    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        updateConnectionStatus(false);
        showToast('Impossible de se connecter au serveur', 'error');
    }
}

async function checkServerConnection() {
    try {
        const response = await fetch(`${API_URL}/public-key`, {
            method: 'GET',
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error('Server not responding');
        }

        state.serverConnected = true;
    } catch (error) {
        state.serverConnected = false;
        throw error;
    }
}

async function initializeKeys() {
    try {
        const response = await fetch(`${API_URL}/public-key`);
        const data = await response.json();

        // In a real system, Alice and Bob would have different keys
        state.alicePublicKey = data.public_key;
        state.bobPublicKey = data.public_key;

        // Display truncated keys in UI
        displayPublicKey('alice-public-key', state.alicePublicKey);
        displayPublicKey('bob-public-key', state.bobPublicKey);
    } catch (error) {
        console.error('Erreur lors de la récupération des clés:', error);
        throw error;
    }
}

// ===========================
// UI Updates
// ===========================

function updateConnectionStatus(connected) {
    const statusDot = document.getElementById('connection-status');
    if (connected) {
        statusDot.style.background = '#22c55e';
    } else {
        statusDot.style.background = '#ef4444';
    }
}

function displayPublicKey(elementId, key) {
    const element = document.getElementById(elementId);
    if (element && key) {
        // Display truncated key for UI
        const truncatedKey = key.substring(0, 50) + '...';
        element.textContent = truncatedKey;
        element.classList.remove('skeleton-loader');
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    toastMessage.textContent = message;
    toast.classList.add('show');

    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function activatePersonCard(person) {
    // Remove all active states
    document.querySelectorAll('.person-card').forEach(card => {
        card.classList.remove('active');
    });

    // Add active state to current person
    const card = document.getElementById(`${person}-card`);
    if (card) {
        card.classList.add('active');
    }
}

// ===========================
// Message Sending Functions
// ===========================

async function sendFromAlice() {
    const message = document.getElementById('alice-message').value.trim();

    if (!message) {
        showToast('Veuillez entrer un message', 'error');
        return;
    }

    if (!state.serverConnected) {
        showToast('Serveur non connecté', 'error');
        return;
    }

    activatePersonCard('alice');
    showFlowTimeline();

    try {
        // Step 1: Add timeline event
        addTimelineItem(
            'Récupération de la clé publique de Bob',
            'Alice obtient la clé publique de Bob pour chiffrer le message'
        );

        await delay(1000);

        // Step 2: Encrypt message
        addTimelineItem(
            'Chiffrement du message',
            'Le message est chiffré avec la clé publique de Bob (RSA-2048 OAEP)'
        );

        const encryptResponse = await fetch(`${API_URL}/encrypt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        if (!encryptResponse.ok) {
            throw new Error('Erreur lors du chiffrement');
        }

        const encryptData = await encryptResponse.json();
        state.bobEncryptedMessage = encryptData.encrypted;

        await delay(1000);

        // Step 3: Send encrypted message
        addTimelineItem(
            'Transmission sécurisée',
            'Le message chiffré est envoyé à Bob via le canal sécurisé'
        );

        // Update Bob's UI
        document.getElementById('bob-received').style.display = 'block';
        document.getElementById('bob-encrypted-received').textContent = state.bobEncryptedMessage;

        activatePersonCard('bob');
        showToast('Message chiffré et envoyé à Bob', 'success');

        // Update exchange status
        updateExchangeStatus('Message en transit vers Bob...');

    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors de l\'envoi du message', 'error');
    }
}

async function sendFromBob() {
    const message = document.getElementById('bob-message').value.trim();

    if (!message) {
        showToast('Veuillez entrer un message', 'error');
        return;
    }

    if (!state.serverConnected) {
        showToast('Serveur non connecté', 'error');
        return;
    }

    activatePersonCard('bob');
    showFlowTimeline();

    try {
        // Step 1: Add timeline event
        addTimelineItem(
            'Récupération de la clé publique d\'Alice',
            'Bob obtient la clé publique d\'Alice pour chiffrer le message'
        );

        await delay(1000);

        // Step 2: Encrypt message
        addTimelineItem(
            'Chiffrement du message',
            'Le message est chiffré avec la clé publique d\'Alice (RSA-2048 OAEP)'
        );

        const encryptResponse = await fetch(`${API_URL}/encrypt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        if (!encryptResponse.ok) {
            throw new Error('Erreur lors du chiffrement');
        }

        const encryptData = await encryptResponse.json();
        state.aliceEncryptedMessage = encryptData.encrypted;

        await delay(1000);

        // Step 3: Send encrypted message
        addTimelineItem(
            'Transmission sécurisée',
            'Le message chiffré est envoyé à Alice via le canal sécurisé'
        );

        // Update Alice's UI
        document.getElementById('alice-received').style.display = 'block';
        document.getElementById('alice-encrypted-received').textContent = state.aliceEncryptedMessage;

        activatePersonCard('alice');
        showToast('Message chiffré et envoyé à Alice', 'success');

        // Update exchange status
        updateExchangeStatus('Message en transit vers Alice...');

    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors de l\'envoi du message', 'error');
    }
}

// ===========================
// Message Decryption Functions
// ===========================

async function aliceDecrypt() {
    if (!state.aliceEncryptedMessage) {
        showToast('Aucun message à déchiffrer', 'error');
        return;
    }

    try {
        addTimelineItem(
            'Déchiffrement par Alice',
            'Alice utilise sa clé privée pour déchiffrer le message'
        );

        const decryptResponse = await fetch(`${API_URL}/decrypt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ encrypted: state.aliceEncryptedMessage })
        });

        if (!decryptResponse.ok) {
            throw new Error('Erreur lors du déchiffrement');
        }

        const decryptData = await decryptResponse.json();

        // Display decrypted message
        const decryptedBox = document.getElementById('alice-decrypted');
        decryptedBox.style.display = 'block';
        decryptedBox.innerHTML = `
            <strong>Message déchiffré avec succès :</strong>
            <p>${decryptData.decrypted}</p>
        `;

        showToast('Message déchiffré avec succès', 'success');
        updateExchangeStatus('Échange sécurisé complété');

    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors du déchiffrement', 'error');
    }
}

async function bobDecrypt() {
    if (!state.bobEncryptedMessage) {
        showToast('Aucun message à déchiffrer', 'error');
        return;
    }

    try {
        addTimelineItem(
            'Déchiffrement par Bob',
            'Bob utilise sa clé privée pour déchiffrer le message'
        );

        const decryptResponse = await fetch(`${API_URL}/decrypt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ encrypted: state.bobEncryptedMessage })
        });

        if (!decryptResponse.ok) {
            throw new Error('Erreur lors du déchiffrement');
        }

        const decryptData = await decryptResponse.json();

        // Display decrypted message
        const decryptedBox = document.getElementById('bob-decrypted');
        decryptedBox.style.display = 'block';
        decryptedBox.innerHTML = `
            <strong>Message déchiffré avec succès :</strong>
            <p>${decryptData.decrypted}</p>
        `;

        showToast('Message déchiffré avec succès', 'success');
        updateExchangeStatus('Échange sécurisé complété');

    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors du déchiffrement', 'error');
    }
}

// ===========================
// Timeline Functions
// ===========================

function showFlowTimeline() {
    const timeline = document.getElementById('flow-timeline');
    timeline.style.display = 'block';

    // Clear previous timeline items
    document.getElementById('timeline-content').innerHTML = '';
}

function addTimelineItem(title, description) {
    const timeline = document.getElementById('timeline-content');
    const item = document.createElement('div');
    item.className = 'timeline-item';

    const time = new Date().toLocaleTimeString('fr-FR');

    item.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-content">
            <div class="timeline-time">${time}</div>
            <div class="timeline-title">${title}</div>
            <div class="timeline-description">${description}</div>
        </div>
    `;

    timeline.appendChild(item);

    // Animate entry
    setTimeout(() => {
        item.style.animationDelay = '0s';
    }, 100);
}

// ===========================
// Helper Functions
// ===========================

function updateExchangeStatus(status) {
    const statusElement = document.getElementById('exchange-status');
    statusElement.textContent = status;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===========================
// Event Listeners
// ===========================

function setupEventListeners() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });

                // Update active state
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // Enter key support for message inputs
    document.getElementById('alice-message').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendFromAlice();
        }
    });

    document.getElementById('bob-message').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendFromBob();
        }
    });
}

// ===========================
// Export functions for global access
// ===========================

window.sendFromAlice = sendFromAlice;
window.sendFromBob = sendFromBob;
window.aliceDecrypt = aliceDecrypt;
window.bobDecrypt = bobDecrypt;