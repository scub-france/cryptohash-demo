// ===========================
// RSA Demo Application
// ===========================

// Global State
const state = {
    alicePublicKey: null,
    bobPublicKey: null,
    aliceEncryptedMessage: null,
    bobEncryptedMessage: null,
    serverConnected: false,
    timelineItems: 0,
    totalExpectedSteps: 0,
    currentScenario: null
};

// API Configuration
const API_URL = 'http://localhost:5000/';

// Timeline Icons
const timelineIcons = {
    keyRetrieval: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke-width="2"/>
        <polyline points="10 17 15 12 10 7" stroke-width="2"/>
        <line x1="15" y1="12" x2="3" y2="12" stroke-width="2"/>
    </svg>`,
    encryption: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="5" y="11" width="14" height="10" rx="2" stroke-width="2"/>
        <path d="M12 3v7" stroke-width="2"/>
        <circle cx="12" cy="16" r="1" fill="currentColor"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke-width="2"/>
    </svg>`,
    transmission: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M22 2L11 13" stroke-width="2"/>
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke-width="2"/>
    </svg>`,
    decryption: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="5" y="11" width="14" height="10" rx="2" stroke-width="2"/>
        <path d="M12 3v7" stroke-width="2"/>
        <circle cx="12" cy="16" r="1" fill="currentColor"/>
        <path d="M17 8V7a5 5 0 0 0-10 0v1" stroke-width="2" stroke-dasharray="2 2"/>
    </svg>`
};

// Timeline Scenarios
const timelineScenarios = {
    'alice-to-bob': {
        totalSteps: 4,
        steps: [
            { type: 'keyRetrieval', actor: 'alice' },
            { type: 'encryption', actor: 'system' },
            { type: 'transmission', actor: 'alice-to-bob' },
            { type: 'decryption', actor: 'bob-success' }
        ]
    },
    'bob-to-alice': {
        totalSteps: 4,
        steps: [
            { type: 'keyRetrieval', actor: 'bob' },
            { type: 'encryption', actor: 'system' },
            { type: 'transmission', actor: 'bob-to-alice' },
            { type: 'decryption', actor: 'alice-success' }
        ]
    }
};

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
// Dynamic Timeline Functions
// ===========================

function initializeTimeline(scenarioType) {
    const timeline = document.getElementById('flow-timeline');
    timeline.style.display = 'block';

    // Set current scenario
    state.currentScenario = scenarioType;
    state.totalExpectedSteps = timelineScenarios[scenarioType].totalSteps;

    // Reset timeline
    state.timelineItems = 0;
    const timelineContent = document.getElementById('timeline-content');
    timelineContent.innerHTML = '';

    // Reset progress bar
    const progress = document.getElementById('timeline-progress');
    progress.style.height = '0%';
    progress.style.transform = 'scaleY(0)';

    // Remove any existing dynamic styles
    removeDynamicTimelineStyles();
}

function updateTimelineProgress() {
    const progress = document.getElementById('timeline-progress');
    const percentage = state.totalExpectedSteps > 0 ?
        (state.timelineItems / state.totalExpectedSteps) * 100 : 0;

    // Smooth progress update
    progress.style.height = `${percentage}%`;
    progress.style.transform = 'scaleY(1)';
    progress.style.transition = 'height 0.5s ease-out';
}

function addDynamicTimelineStyles() {
    // Remove existing dynamic styles first
    removeDynamicTimelineStyles();

    // Create dynamic CSS for animation delays
    const style = document.createElement('style');
    style.id = 'dynamic-timeline-styles';

    let css = '';
    for (let i = 1; i <= state.totalExpectedSteps + 2; i++) { // +2 for buffer
        const delay = i * 0.1;
        css += `.timeline-item:nth-child(${i}) { animation-delay: ${delay}s; }\n`;
    }

    style.textContent = css;
    document.head.appendChild(style);
}

function removeDynamicTimelineStyles() {
    const existingStyle = document.getElementById('dynamic-timeline-styles');
    if (existingStyle) {
        existingStyle.remove();
    }
}

function addTimelineItem(title, description, actor = 'system', codePreview = '', icon = 'encryption') {
    const timeline = document.getElementById('timeline-content');
    const item = document.createElement('div');
    item.className = `timeline-item ${actor}`;

    const time = new Date().toLocaleTimeString('fr-FR');

    // Map actors to display names
    const actorNames = {
        'alice': 'Alice',
        'bob': 'Bob',
        'system': 'Système',
        'alice-to-bob': 'Alice → Bob',
        'bob-to-alice': 'Bob → Alice'
    };

    // Map icons
    const iconMap = {
        'keyRetrieval': timelineIcons.keyRetrieval,
        'encryption': timelineIcons.encryption,
        'transmission': timelineIcons.transmission,
        'decryption': timelineIcons.decryption
    };

    // Determine if this is a success state
    const isSuccess = actor.includes('success');
    const baseActor = actor.replace('-success', '');

    item.innerHTML = `
        <div class="timeline-dot">${iconMap[icon] || iconMap.encryption}</div>
        <div class="timeline-content">
            <div class="timeline-header-row">
                <span class="timeline-time">${time}</span>
                <span class="timeline-actor">${actorNames[baseActor] || 'Système'}</span>
            </div>
            <div class="timeline-action">${title}</div>
            <div class="timeline-description">${description}</div>
            ${codePreview ? `<div class="timeline-code">${codePreview}</div>` : ''}
            <div class="timeline-status">
                <span class="status-indicator"></span>
                <span>${isSuccess ? 'Communication sécurisée complétée' : 'Étape complétée'}</span>
            </div>
        </div>
    `;

    timeline.appendChild(item);

    // Update progress
    state.timelineItems++;

    // Add dynamic styles if this is the first item
    if (state.timelineItems === 1) {
        addDynamicTimelineStyles();
    }

    updateTimelineProgress();
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
    initializeTimeline('alice-to-bob');

    try {
        // Step 1: Add timeline event for key retrieval
        addTimelineItem(
            'Récupération de la clé publique',
            'Alice obtient la clé publique de Bob depuis le serveur de clés pour pouvoir chiffrer son message',
            'alice',
            '🔑 Clé publique de Bob: MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCg...',
            'keyRetrieval'
        );

        await delay(1000);

        // Step 2: Encrypt message
        addTimelineItem(
            'Chiffrement du message',
            'Le message est chiffré avec l\'algorithme RSA-2048 OAEP en utilisant la clé publique de Bob',
            'system',
            `📝 Message original: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
            'encryption'
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
            'Le message chiffré est transmis à Bob via le canal de communication. Même si intercepté, il reste illisible sans la clé privée',
            'alice-to-bob',
            `🔐 Message chiffré: ${state.bobEncryptedMessage.substring(0, 50)}...`,
            'transmission'
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
    initializeTimeline('bob-to-alice');

    try {
        // Step 1: Add timeline event
        addTimelineItem(
            'Récupération de la clé publique',
            'Bob obtient la clé publique d\'Alice depuis le serveur de clés pour pouvoir chiffrer son message',
            'bob',
            '🔑 Clé publique d\'Alice: MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCg...',
            'keyRetrieval'
        );

        await delay(1000);

        // Step 2: Encrypt message
        addTimelineItem(
            'Chiffrement du message',
            'Le message est chiffré avec l\'algorithme RSA-2048 OAEP en utilisant la clé publique d\'Alice',
            'system',
            `📝 Message original: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
            'encryption'
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
            'Le message chiffré est transmis à Alice via le canal de communication. Même si intercepté, il reste illisible sans la clé privée',
            'bob-to-alice',
            `🔐 Message chiffré: ${state.aliceEncryptedMessage.substring(0, 50)}...`,
            'transmission'
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
        const decryptResponse = await fetch(`${API_URL}/decrypt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ encrypted: state.aliceEncryptedMessage })
        });

        if (!decryptResponse.ok) {
            throw new Error('Erreur lors du déchiffrement');
        }

        const decryptData = await decryptResponse.json();

        // Add decryption timeline event
        addTimelineItem(
            'Déchiffrement réussi',
            'Alice utilise sa clé privée pour déchiffrer le message. Seul le détenteur de la clé privée peut lire le contenu',
            'alice-success',
            `✅ Message déchiffré: "${decryptData.decrypted}"`,
            'decryption'
        );

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
        const decryptResponse = await fetch(`${API_URL}/decrypt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ encrypted: state.bobEncryptedMessage })
        });

        if (!decryptResponse.ok) {
            throw new Error('Erreur lors du déchiffrement');
        }

        const decryptData = await decryptResponse.json();

        // Add decryption timeline event
        addTimelineItem(
            'Déchiffrement réussi',
            'Bob utilise sa clé privée pour déchiffrer le message. Seul le détenteur de la clé privée peut lire le contenu',
            'bob-success',
            `✅ Message déchiffré: "${decryptData.decrypted}"`,
            'decryption'
        );

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