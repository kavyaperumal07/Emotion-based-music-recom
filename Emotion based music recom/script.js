const video = document.getElementById('video');
const emotionDisplay = document.getElementById('emotion-display');
const confidenceScore = document.getElementById('confidence-score');
const playlistContainer = document.getElementById('playlist-container');
const bgGradient = document.getElementById('bg-gradient');
const loadingOverlay = document.getElementById('loading');

const musicData = {
    happy: {
        color: '#fce38a',
        playlists: [
            { name: "Tropical House", desc: "Sunny vibes for a happy mood", icon: "fa-sun", url: "https://www.youtube.com/results?search_query=tropical+house+playlist" },
            { name: "Feel Good Pop", desc: "Energy boost for your day", icon: "fa-bolt", url: "https://www.youtube.com/results?search_query=feel+good+pop+playlist" },
            { name: "Happy Soul", desc: "Groovy tracks to keep you smiling", icon: "fa-face-grin-stars", url: "https://www.youtube.com/results?search_query=happy+soul+music" }
        ]
    },
    sad: {
        color: '#4568dc',
        playlists: [
            { name: "Lofi Chill Beats", desc: "Soft rhythms for reflection", icon: "fa-cloud-rain", url: "https://www.youtube.com/results?search_query=lofi+chill+beats" },
            { name: "Acoustic Melancholy", desc: "Emotional strings and piano", icon: "fa-guitar", url: "https://www.youtube.com/results?search_query=acoustic+sad+songs" },
            { name: "Midnight Rain", desc: "Ambient sounds for deep thought", icon: "fa-moon", url: "https://www.youtube.com/results?search_query=ambient+rain+music" }
        ]
    },
    angry: {
        color: '#ff4b2b',
        playlists: [
            { name: "High Octane Rock", desc: "Let the energy flow", icon: "fa-fire", url: "https://www.youtube.com/results?search_query=high+energy+rock+music" },
            { name: "Phonk Mix", desc: "Bass-heavy drift beats", icon: "fa-car", url: "https://www.youtube.com/results?search_query=phonk+playlist" },
            { name: "Gym Motivation", desc: "Crush your limits", icon: "fa-dumbbell", url: "https://www.youtube.com/results?search_query=intense+workout+music" }
        ]
    },
    neutral: {
        color: '#243b55',
        playlists: [
            { name: "Deep Focus", desc: "Stay in the zone", icon: "fa-brain", url: "https://www.youtube.com/results?search_query=deep+focus+study+music" },
            { name: "Coffee Shop Jazz", desc: "Light and sophisticated", icon: "fa-mug-hot", url: "https://www.youtube.com/results?search_query=coffee+shop+jazz" },
            { name: "Nature Ambience", desc: "The sounds of tranquility", icon: "fa-leaf", url: "https://www.youtube.com/results?search_query=nature+ambience+music" }
        ]
    },
    surprised: {
        color: '#f953c6',
        playlists: [
            { name: "Future Bass", desc: "Unexpected drops and synths", icon: "fa-wand-magic-sparkles", url: "https://www.youtube.com/results?search_query=future+bass+mix" },
            { name: "Electric Surprise", desc: "Dynamic and colorful sounds", icon: "fa-bolt-lightning", url: "https://www.youtube.com/results?search_query=experimental+electronic+music" }
        ]
    },
    fear: {
        color: '#3d3393',
        playlists: [
            { name: "Cinematic Dark", desc: "Tense and atmospheric scores", icon: "fa-ghost", url: "https://www.youtube.com/results?search_query=dark+cinematic+music" },
            { name: "Deep Space", desc: "Empty and mysterious echoes", icon: "fa-user-astronaut", url: "https://www.youtube.com/results?search_query=deep+space+ambient" }
        ]
    },
    disgust: {
        color: '#11998e',
        playlists: [
            { name: "Grunge & Dirt", desc: "Raw and unapologetic sound", icon: "fa-bacteria", url: "https://www.youtube.com/results?search_query=grunge+playlist" },
            { name: "Acid Techno", desc: "Distorted and gritty rhythms", icon: "fa-vial", url: "https://www.youtube.com/results?search_query=acid+techno+mix" }
        ]
    }
};

let lastEmotion = null;

function logDebug(msg) {
    const debugEl = document.getElementById('debug-msg');
    debugEl.style.display = 'block';
    debugEl.innerText = msg;
    console.log(msg);
}

async function startApp() {
    try {
        logDebug("Initializing AI models...");
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        
        logDebug("Models loaded. Accessing camera...");
        await startVideo();
        
        loadingOverlay.style.opacity = '0';
        setTimeout(() => loadingOverlay.style.display = 'none', 500);
        
        detectEmotion();
    } catch (err) {
        logDebug("Error: " + err.message);
        console.error("Initialization error:", err);
        document.getElementById('retry-cam').style.display = 'block';
    }
}

async function startVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 }
            } 
        });
        video.srcObject = stream;
        await video.play();
        logDebug("Camera active.");
    } catch (err) {
        throw new Error("Camera access failed: " + err.message);
    }
}

document.getElementById('retry-cam').addEventListener('click', () => {
    document.getElementById('retry-cam').style.display = 'none';
    startApp();
});

function detectEmotion() {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.getElementById('video-container').append(canvas);
    
    const displaySize = { width: video.offsetWidth, height: video.offsetHeight };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();

        if (detections && detections.length > 0) {
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            
            // Get most likely emotion
            const expressions = detections[0].expressions;
            const emotion = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
            const score = expressions[emotion];

            updateUI(emotion, score);
        }
    }, 200);
}

function updateUI(emotion, score) {
    if (emotion === lastEmotion) return;
    lastEmotion = emotion;

    // Update Text
    emotionDisplay.innerText = emotion;
    confidenceScore.innerText = `${Math.round(score * 100)}%`;

    // Update Styles
    const moodInfo = musicData[emotion] || musicData.neutral;
    emotionDisplay.style.background = moodInfo.color;
    bgGradient.style.background = `radial-gradient(circle at 50% 50%, ${moodInfo.color}, transparent 50%)`;
    
    // Update Playlists
    renderPlaylists(moodInfo.playlists);
}

function renderPlaylists(playlists) {
    playlistContainer.innerHTML = '';
    
    playlists.forEach((pl, index) => {
        const plCard = document.createElement('a');
        plCard.className = 'playlist-card';
        plCard.href = pl.url;
        plCard.target = '_blank';
        plCard.style.animation = `fadeIn 0.5s ease forwards ${index * 0.1}s`;
        plCard.style.opacity = '0';

        plCard.innerHTML = `
            <div class="playlist-img"><i class="fa-solid ${pl.icon}"></i></div>
            <div class="playlist-info">
                <h3>${pl.name}</h3>
                <p>${pl.desc}</p>
            </div>
            <div style="margin-left: auto; color: var(--accent-color);"><i class="fa-solid fa-chevron-right"></i></div>
        `;
        
        playlistContainer.appendChild(plCard);
    });
}

// Add CSS animation dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
    }
`;
document.head.appendChild(style);

window.onload = startApp;
