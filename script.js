// Language State
let currentLang = 'en';

const DICTIONARY = {
    en: {
        title: "The King Has Spoken",
        subtitle: "Opinions of the Absolute Sovereign on Worldly Matters",
        situationTitle: "The Royal Situation Room",
        eventsTitle: "Global Events (Select to Analyze)",
        aiTitle: "His Majesty's Decree", // Removed (AI Processed)
        decreesTitle: "Latest Decrees",
        ghostsTitle: "The Council of Ghosts",
        toggleBtn: "عربي",
        scanning: "Scanning global frequencies...",
        subjects: "Subjects Witnessed",
        clickPrompt: "Select a news item to hear the Royal Opinion..."
    },
    ar: {
        title: "الملك قد نطق",
        subtitle: "آراء الحاكم المطلق في شؤون العالم",
        situationTitle: "غرفة العمليات الملكية",
        eventsTitle: "أحداث عالمية (اضغط للتحليل)",
        aiTitle: "مرسوم جلالته", // Removed (AI Processed)
        decreesTitle: "أحدث المراسيم",
        ghostsTitle: "مجلس الأشباح",
        toggleBtn: "English",
        scanning: "جاري مسح الترددات العالمية...",
        subjects: "الرعايا الذين شهدوا هذا",
        clickPrompt: "اضغط على خبر لسماع الرأي الملكي..."
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
        // Re-render feed to apply translation to static parts of news items if any
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


// --- News & Interaction ---
let newsInterval;
let currentNewsItems = [];
let selectedNewsIndex = -1; // Track selected item

async function startRoyalNewsFeed() {
    const ticker = document.getElementById('live-ticker');

    if (newsInterval) clearInterval(newsInterval);

    const loadingText = DICTIONARY[currentLang].scanning;
    // Don't wipe if we are just refreshing logic, only if empty
    if (ticker.children.length === 0) ticker.innerHTML = `<div class="ticker-item">${loadingText}</div>`;

    async function fetchNews() {
        try {
            const response = await fetch(`/api/news?lang=${currentLang}`);
            const newsItems = await response.json();

            if (!newsItems || newsItems.length === 0) return;

            currentNewsItems = newsItems;

            // Re-render list
            ticker.innerHTML = '';
            newsItems.forEach((item, index) => {
                const tickerItem = document.createElement('div');
                tickerItem.className = 'ticker-item interactable'; // Add interactable class
                if (index === selectedNewsIndex) tickerItem.classList.add('selected');

                tickerItem.style.animationDelay = `${index * 0.1}s`;

                tickerItem.innerHTML = `
                    <span class="ticker-timestamp">${new Date(item.timestamp).toLocaleTimeString()} (${item.source})</span>
                    <strong>${item.title}</strong>
                `;

                // CLICK EVENT
                tickerItem.addEventListener('click', () => {
                    selectNewsItem(index);
                });

                ticker.appendChild(tickerItem);
            });

            // Update Council Data
            if (newsItems.length > 0) {
                if (newsItems[0].councilData) {
                    activeCouncilData = newsItems[0].councilData;
                    // Initial render of council if needed
                    const container = document.getElementById('council-container');
                    if (container.children.length <= 1) renderCouncilInitial(activeCouncilData);
                }
            }

            // Prompt user if nothing selected
            if (selectedNewsIndex === -1) {
                const aiBox = document.getElementById('ai-response-box');
                aiBox.innerHTML = `<span style="color:var(--text-secondary); opacity: 0.7;">${DICTIONARY[currentLang].clickPrompt}</span>`;
            }

        } catch (error) {
            console.error("News Fetch Error:", error);
            ticker.innerHTML = `<div class="ticker-item breaking">Error: ${error.message}</div>`;
        }
    }

    await fetchNews();
    newsInterval = setInterval(fetchNews, 60000); // Fetch new headlines every minute
}

function selectNewsItem(index) {
    selectedNewsIndex = index;
    const newsItem = currentNewsItems[index];

    // UI Update
    const items = document.querySelectorAll('.ticker-item');
    items.forEach(i => i.classList.remove('selected'));
    if (items[index]) items[index].classList.add('selected');

    updateRoyalAI(newsItem);
}

function updateRoyalAI(newsItem) {
    const aiBox = document.getElementById('ai-response-box');
    const response = newsItem.royalComment || "...";

    // Clear quickly
    aiBox.innerHTML = '';

    const topic = newsItem.title.length > 60 ? newsItem.title.substring(0, 60) + '...' : newsItem.title;

    // Make text specific by quoting the headline
    const specificHeader = currentLang === 'ar'
        ? `بخصوص: "${topic}"`
        : `Regarding: "${topic}"`;

    // Typewriter effect
    aiBox.innerHTML = `<div style="margin-bottom: 1rem; color: #888; font-size: 0.9rem;">${specificHeader}</div>`;

    let i = 0;
    const typingSpeed = 25;

    function typeWriter() {
        if (i < response.length) {
            const currentText = response.substring(0, i + 1);
            // Re-construct content
            aiBox.innerHTML = `<div style="margin-bottom: 1rem; color: #888; font-size: 0.9rem;">${specificHeader}</div>`
                + `<span style="color: var(--royal-gold); font-size: 1.1em;">${currentText}</span>`
                + '<span id="ai-cursor" class="cursor">|</span>';
            i++;
            setTimeout(typeWriter, typingSpeed);
        }
    }
    typeWriter();
}

function renderCouncilInitial(ghosts) {
    const container = document.getElementById('council-container');
    container.innerHTML = '';

    ghosts.forEach((ghost, index) => {
        const card = document.createElement('div');
        card.className = 'ghost-card';
        const initialAdvice = ghost.all_advice[Math.floor(Math.random() * ghost.all_advice.length)];

        card.innerHTML = `
            <div class="ghost-name">${ghost.name}</div>
            <div class="ghost-advice" style="transition: opacity 0.5s ease;">"${initialAdvice}"</div>
        `;
        container.appendChild(card);
    });
}
