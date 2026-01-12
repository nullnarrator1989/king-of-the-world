const express = require('express');
const Parser = require('rss-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const parser = new Parser();
const PORT = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '.')));

// --- Visitor Counter ---
const COUNTER_FILE = path.join(__dirname, 'visitors.json');
let visitorCount = 0;

try {
    if (fs.existsSync(COUNTER_FILE)) {
        const data = fs.readFileSync(COUNTER_FILE);
        visitorCount = JSON.parse(data).count;
    } else {
        visitorCount = 1200;
    }
} catch (e) {
    visitorCount = 1200;
}

function saveVisitorCount() {
    try {
        fs.writeFileSync(COUNTER_FILE, JSON.stringify({ count: visitorCount }));
    } catch (e) { }
}

const FEEDS_EN = [
    'http://feeds.bbci.co.uk/news/world/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    'https://www.aljazeera.com/xml/rss/all.xml',
    'http://feeds.reuters.com/reuters/worldNews',
    'http://rss.cnn.com/rss/edition_world.rss'
];

const FEEDS_AR = [
    'https://www.bbc.com/arabic/index.xml',
    'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f77d/73d7480c-1a25-4527-bd06-d73dd23630f6',
    'https://arabic.cnn.com/rss',
    'https://www.skynewsarabia.com/rss'
];

// --- ANALYTICS ENGINE (SIMULATED VOX POPULI) ---

function analyzePublicSentiment(text) {
    // Quick heuristic to simulate "Online Opinion"
    const lower = text.toLowerCase();
    const positiveWords = ['win', 'success', 'gain', 'growth', 'peace', 'deal', 'record', 'high', 'best'];
    const negativeWords = ['crisis', 'war', 'crash', 'dead', 'kill', 'fail', 'loss', 'risk', 'fear', 'threat'];

    let score = 0;
    positiveWords.forEach(w => { if (lower.includes(w)) score++; });
    negativeWords.forEach(w => { if (lower.includes(w)) score--; });

    if (score > 0) return 'Optimistic';
    if (score < 0) return 'Outraged';
    return 'Divided';
}

const ANALYTICS_TEMPLATES_EN = {
    // Structure: (Subject, Sentiment) => Response
    'Optimistic': [
        (s) => `My analysts report the digital realm is celebrating '${s}'. While I admire the optimism, I decree caution. Success breeds complacency.`,
        (s) => `The online consensus regarding '${s}' is surprisingly positive. I shall allow this joy, for now.`,
        (s) => `The people see '${s}' as a victory. I see it as a stepping stone. We must demand more.`
    ],
    'Outraged': [
        (s) => `The public voices are screaming about '${s}'. Their anger is justified. My solution: Swift justice, not endless debate.`,
        (s) => `I sense deep anxiety in the global network concerning '${s}'. Fear is a poor advisor. Stand firm.`,
        (s) => `The sentiment analytics for '${s}' show widespread panic. Good. Calm seas never made a skilled sailor.`
    ],
    'Divided': [
        (s) => `The world is torn on the issue of '${s}'. Half say yes, half say no. I say: Focus on the facts, not the noise.`,
        (s) => `My feed shows chaos regarding '${s}'. When the people are confused, the King must be clear. Here is the truth...`,
        (s) => `Confusion reigns online about '${s}'. It is a complex beast. We must study it before we strike.`
    ]
};

const ANALYTICS_TEMPLATES_AR = {
    'Optimistic': [
        (s) => `محللو القصر يفيدون بأن العالم الرقمي يحتفل بـ '${s}'. بينما أقدر هذا التفاؤل، لكنني آمر بالحذر. النجاح يولد التراخي.`,
        (s) => `الإجماع عبر الإنترنت بخصوص '${s}' إيجابي بشكل مدهش. سأسمح بهذا الفرح، في الوقت الحالي.`,
        (s) => `الناس يرون '${s}' كنصر. أنا أراه كخطوة أولى. يجب أن نطالب بالمزيد.`
    ],
    'Outraged': [
        (s) => `الأصوات العامة تصرخ بشأن '${s}'. غضبهم مبرر. حلي: عدالة ناجزة، لا جدال لا ينتهي.`,
        (s) => `أشعر بقلق عميق في الشبكة العالمية بخصوص '${s}'. الخوف مستشار سيء. اثبتوا.`,
        (s) => `تحليلات المشاعر لـ '${s}' تظهر ذعراً واسع النطاق. جيد. البحار الهادئة لا تصنع بحاراً ماهراً.`
    ],
    'Divided': [
        (s) => `العالم منقسم حول قضية '${s}'. النصف يقول نعم، والنصف يقول لا. أنا أقول: ركزوا على الحقائق، لا الضجيج.`,
        (s) => `موجزي يظهر فوضى بخصوص '${s}'. عندما يرتبك الناس، يجب أن يكون الملك واضحاً. إليكم الحقيقة...`,
        (s) => `الغموض يسود الإنترنت حول '${s}'. إنه وحش معقد. يجب أن ندرسه قبل أن نضرب.`
    ]
};

// KEYWORD OVERRIDES (Specific Entities still matter)
const ENTITY_TEMPLATES_EN = {
    'trump': "Public data on Trump forces a realization: Institutions must be stronger than individuals.",
    'china': "Analytics on China show a rising superpower. We must adapt our strategies, not ignoring the data.",
    'war': "The global sentiment on War is clear: Exhaustion. The people want peace, and I decree they shall have it.",
    'climate': "The data on Climate is undeniable. The planet is screaming. We must listen to the science, not the lobbyists."
};

const ENTITY_TEMPLATES_AR = {
    'trump': "البيانات العامة حول ترامب تفرض حقيقة: المؤسسات يجب أن تكون أقوى من الأفراد.",
    'china': "التحليلات حول الصين تظهر قوة عظمى صاعدة. يجب أن نكيف استراتيجياتنا، لا أن نتجاهل البيانات.",
    'war': "الشعور العالمي تجاه الحرب واضح: إنهاك. الناس يريدون السلام، وأنا آمر بأن يحصلوا عليه.",
    'climate': "البيانات حول المناخ لا يمكن إنكارها. الكوكب يصرخ. يجب أن نستمع للعلم، لا لجماعات الضغط."
};

function generateAnalyticsDecree(title, lang) {
    const lowerTitle = title.toLowerCase();

    // 1. Check Specific Entity Override
    const entityTemplates = lang === 'ar' ? ENTITY_TEMPLATES_AR : ENTITY_TEMPLATES_EN;
    for (const key of Object.keys(entityTemplates)) {
        if (lowerTitle.includes(key)) {
            return entityTemplates[key];
        }
    }

    // 2. Generic "Vox Populi" Logic
    const sentiment = analyzePublicSentiment(title);
    const templates = lang === 'ar' ? ANALYTICS_TEMPLATES_AR : ANALYTICS_TEMPLATES_EN;
    const options = templates[sentiment];

    // Extract subject (rough 3 words)
    const words = title.split(' ');
    const subject = words.slice(0, 3).join(' ') + '...';

    return options[Math.floor(Math.random() * options.length)](subject);
}


// --- Endpoints ---

app.get('/api/visit', (req, res) => {
    visitorCount++;
    saveVisitorCount();
    res.json({ count: visitorCount });
});

app.get('/api/news', async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const feeds = lang === 'ar' ? FEEDS_AR : FEEDS_EN;

        const randomFeedUrl = feeds[Math.floor(Math.random() * feeds.length)];
        const feed = await parser.parseURL(randomFeedUrl);
        const rawItems = feed.items.slice(0, 8);

        // Mock Council 
        const fullCouncilData = [
            { id: "machiavelli", name_en: "Machiavelli", name_ar: "مكيافيلي", all_advice_en: ["Use the data to your advantage.", "Public opinion is a weapon."], all_advice_ar: ["استخدم البيانات لصالحك.", "الرأي العام سلاح."] },
            { id: "suntzu", name_en: "Sun Tzu", name_ar: "صن تزو", all_advice_en: ["Know the enemy's mind.", "Information is victory."], all_advice_ar: ["اعرف عقل عدوك.", "المعلومات هي النصر."] }
        ];

        const processedNews = rawItems.map((item) => {
            // Generate ANALYTICS decree
            const royalComment = generateAnalyticsDecree(item.title, lang);

            // Format Council for lang
            const rCouncil = fullCouncilData.map(g => ({
                id: g.id,
                name: lang === 'ar' ? g.name_ar : g.name_en,
                all_advice: lang === 'ar' ? g.all_advice_ar : g.all_advice_en
            }));

            return {
                title: item.title,
                source: feed.title,
                link: item.link,
                timestamp: item.pubDate,
                royalComment: royalComment,
                councilData: rCouncil
            };
        });

        res.json(processedNews);

    } catch (error) {
        console.error("News Fetch Error:", error);
        res.status(500).json({ error: "The Royal messengers are lost." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
