// Language State
let currentLang = 'en';

const DICTIONARY = {
    en: {
        title: "The King Has Spoken",
        subtitle: "Opinions of the Absolute Sovereign on Worldly Matters",
        situationTitle: "The Royal Situation Room",
        eventsTitle: "Global Events (Live)",
        aiTitle: "His Majesty's Take (AI Processed)",
        decreesTitle: "Latest Decrees",
        ghostsTitle: "The Council of Ghosts",
        toggleBtn: "عربي",
        scanning: "Scanning global frequencies...",
        subjects: "Subjects Witnessed"
    },
    ar: {
        title: "الملك قد نطق",
        subtitle: "آراء الحاكم المطلق في شؤون العالم",
        situationTitle: "غرفة العمليات الملكية",
        eventsTitle: "أحداث عالمية (مباشر)",
        aiTitle: "رأي جلالته (معالجة ذكية)",
        decreesTitle: "أحدث المراسيم",
        ghostsTitle: "مجلس الأشباح",
        toggleBtn: "English",
        scanning: "جاري مسح الترددات العالمية...",
        subjects: "الرعايا الذين شهدوا هذا"
    }
};

const opinions = [
    {
        topic: "On The Economy",
        text: "Why trade gold for paper? Paper burns. Gold shines. I decree that all currency shall henceforth be backed by something shiny.",
        date: "Jan 12, 2026"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    setupLanguageToggle();
    renderDecrees();
    startRoyalNewsFeed();
    initVisitorCounter();
    startCouncilRotation();
});

function setupLanguageToggle() {
    const btn = document.getElementById('lang-toggle');
    btn.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'ar' : 'en';
        updateLanguageUI();
        startRoyalNewsFeed();
    });
}

function updateLanguageUI() {
    const dict = DICTIONARY[currentLang];

    if (currentLang === 'ar') {
        document.body.classList.add('rtl');
        document.documentElement.lang = 'ar';
        document.documentElement.dir = 'rtl';
    } else {
        document.body.classList.remove('rtl');
        document.documentElement.lang = 'en';
        document.documentElement.dir = 'ltr';
    }

    document.querySelector('.hero h1').textContent = dict.title;
    document.querySelector('.hero p').textContent = dict.subtitle;
    document.querySelector('.section-title').textContent = dict.situationTitle;
    document.querySelector('.news-feed-container h3').textContent = dict.eventsTitle;
    document.querySelector('.royal-ai-container h3').textContent = dict.aiTitle;
    document.querySelectorAll('.section-title')[1].textContent = dict.ghostsTitle;
    document.querySelectorAll('.section-title')[2].textContent = dict.decreesTitle;
    document.getElementById('lang-toggle').textContent = dict.toggleBtn;

    refreshVisitorText();
}

function refreshVisitorText() {
    const counter = document.getElementById('visitor-counter');
    const currentCount = counter.getAttribute('data-count') || '...';
    counter.textContent = `${DICTIONARY[currentLang].subjects}: ${currentCount}`;
}

function renderDecrees() {
    const grid = document.getElementById('decrees-grid');
    grid.innerHTML = '';
    opinions.forEach((op, index) => {
        const card = document.createElement('div');
        card.className = 'decree-card glass-panel';
        card.style.transitionDelay = `${index * 100}ms`;
        card.innerHTML = `
            <span class="decree-date">${op.date}</span>
            <h3>${op.topic}</h3>
            <p class="decree-text">${op.text}</p>
        `;
        grid.appendChild(card);
    });
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                obs.unobserve(entry.target);
            }
        });
    });
    document.querySelectorAll('.decree-card').forEach(c => observer.observe(c));
}

// --- Visitor Counter ---
async function initVisitorCounter() {
    try {
        const res = await fetch('/api/visit');
        const data = await res.json();
        const counter = document.getElementById('visitor-counter');
        counter.setAttribute('data-count', data.count.toLocaleString());
        refreshVisitorText();
    } catch (e) {
        console.error("Counter error");
    }
}

// --- Live Council State ---
let activeCouncilData = [];
let rotationInterval;

function startCouncilRotation() {
    if (rotationInterval) clearInterval(rotationInterval);

    // FASTER: Rotate random ghost every 5 seconds
    rotationInterval = setInterval(() => {
        if (activeCouncilData.length === 0) return;

        const ghostIndex = Math.floor(Math.random() * activeCouncilData.length);
        const ghost = activeCouncilData[ghostIndex];
        const newAdvice = ghost.all_advice[Math.floor(Math.random() * ghost.all_advice.length)];

        const ghostCards = document.querySelectorAll('.ghost-card');
        if (ghostCards[ghostIndex]) {
            const adviceEl = ghostCards[ghostIndex].querySelector('.ghost-advice');
            adviceEl.style.opacity = '0';
            setTimeout(() => {
                adviceEl.textContent = `"${newAdvice}"`;
                adviceEl.style.opacity = '1';
            }, 500);
        }
    }, 5000);
}


// --- News & AI ---
let newsInterval;
let aiCycleInterval;
let currentNewsItems = [];

async function startRoyalNewsFeed() {
    const ticker = document.getElementById('live-ticker');

    if (newsInterval) clearInterval(newsInterval);
    if (aiCycleInterval) clearInterval(aiCycleInterval);

    const loadingText = DICTIONARY[currentLang].scanning;
    ticker.innerHTML = `<div class="ticker-item">${loadingText}</div>`;

    async function fetchNews() {
        try {
            const response = await fetch(`/api/news?lang=${currentLang}`);
            const newsItems = await response.json();

            if (!newsItems || newsItems.length === 0) return;

            currentNewsItems = newsItems;

            // Update Ticker
            ticker.innerHTML = '';
            newsItems.forEach((item, index) => {
                const tickerItem = document.createElement('div');
                tickerItem.className = 'ticker-item';
                tickerItem.style.animationDelay = `${index * 0.2}s`;

                tickerItem.innerHTML = `
                    <span class="ticker-timestamp">${new Date(item.timestamp).toLocaleTimeString()} (${item.source})</span>
                    <strong>${item.title}</strong>
                `;
                ticker.appendChild(tickerItem);
            });

            // Setup Initial Data
            if (newsItems.length > 0) {
                if (newsItems[0].councilData) {
                    activeCouncilData = newsItems[0].councilData;
                    renderCouncilInitial(activeCouncilData);
                }
                // Start Cycle
                startKingNewsCycle();
            }

        } catch (error) {
            console.error("News Fetch Error:", error);
            ticker.innerHTML = `<div class="ticker-item breaking">Error: ${error.message}</div>`;
        }
    }

    await fetchNews();
    newsInterval = setInterval(fetchNews, 60000);
}

function startKingNewsCycle() {
    if (aiCycleInterval) clearInterval(aiCycleInterval);

    let cycleIndex = 0;

    // Show first immediately
    if (currentNewsItems[cycleIndex]) updateRoyalAI(currentNewsItems[cycleIndex]);

    // Cycle every 12 seconds to "monitor" the feed
    aiCycleInterval = setInterval(() => {
        cycleIndex++;
        if (cycleIndex >= currentNewsItems.length) cycleIndex = 0;
        if (currentNewsItems[cycleIndex]) {
            updateRoyalAI(currentNewsItems[cycleIndex]);
        }
    }, 12000);
}

function updateRoyalAI(newsItem) {
    const aiBox = document.getElementById('ai-response-box');
    const response = newsItem.royalComment || "...";

    // Clear quickly
    aiBox.innerHTML = '';

    // Formatting Header
    const topic = newsItem.title.length > 50 ? newsItem.title.substring(0, 50) + '...' : newsItem.title;
    const analyzingText = currentLang === 'ar' ? "تحليل الموضوع" : "Analyzing";

    // Step 1: Show "Analyzing" state
    aiBox.innerHTML = `<span style="color:var(--royal-gold); animation: blink 0.5s infinite;">[${analyzingText}: "${topic}"]</span>`;

    // Step 2: After 1s, show typewritten response
    setTimeout(() => {
        aiBox.innerHTML = ''; // Clear "Analyzing"
        aiBox.innerHTML = `<span style="color:var(--text-secondary); font-size: 0.8em; margin-bottom: 5px; display:block;">RE: ${topic}</span>`;

        let i = 0;
        const typingSpeed = 30;

        function typeWriter() {
            if (i < response.length) {
                // Determine current text + cursor
                const currentText = response.substring(0, i + 1);
                // We append to existing header
                const headerHTML = `<span style="color:var(--text-secondary); font-size: 0.8em; margin-bottom: 5px; display:block;">RE: ${topic}</span>`;
                aiBox.innerHTML = headerHTML + currentText + '<span id="ai-cursor" class="cursor">|</span>';
                i++;
                setTimeout(typeWriter, typingSpeed);
            }
        }
        typeWriter();
    }, 1000);
}

function renderCouncilInitial(ghosts) {
    // Only render if container is empty or we fetched fresh data structure
    const container = document.getElementById('council-container');
    if (container.children.length > 1) return; // Already rendered, don't wipe to avoid jumpiness

    container.innerHTML = '';

    ghosts.forEach((ghost, index) => {
        const card = document.createElement('div');
        card.className = 'ghost-card';
        // Pick initial random advice
        const initialAdvice = ghost.all_advice[Math.floor(Math.random() * ghost.all_advice.length)];

        card.innerHTML = `
            <div class="ghost-name">${ghost.name}</div>
            <div class="ghost-advice" style="transition: opacity 0.5s ease;">"${initialAdvice}"</div>
        `;
        container.appendChild(card);
    });
}
