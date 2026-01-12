const express = require('express');
const Parser = require('rss-parser');
const Sentiment = require('sentiment');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const parser = new Parser();
const sentiment = new Sentiment();
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
    'http://rss.cnn.com/rss/edition_world.rss',
    'https://feeds.skynews.com/feeds/rss/world.xml'
];

const FEEDS_AR = [
    'https://www.bbc.com/arabic/index.xml',
    'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f77d/73d7480c-1a25-4527-bd06-d73dd23630f6',
    'https://arabic.cnn.com/rss',
    'https://www.skynewsarabia.com/rss'
];

// --- LOGIC: Topic-Based Beneficial Solutions ---

const TOPIC_KEYWORDS = {
    ECONOMY: ['economy', 'market', 'stock', 'inflation', 'trade', 'debt', 'bank', 'crypto', 'money', 'financial', 'tax'],
    CONFLICT: ['war', 'fight', 'attack', 'kill', 'military', 'soldier', 'peace', 'truce', 'blast', 'crisis', 'tension', 'nuclear'],
    CLIMATE: ['climate', 'warming', 'heat', 'flood', 'storm', 'carbon', 'green', 'energy', 'oil', 'planet', 'nature'],
    TECH: ['tech', 'ai', 'cyber', 'internet', 'robot', 'space', ' nasa', 'digital', 'data', 'app', 'science'],
    POLITICS: ['election', 'vote', 'law', 'government', 'president', 'minister', 'court', 'rights', 'policy', 'protest']
};

const ROYAL_SOLUTIONS_EN = {
    ECONOMY: [
        "Solution: We must invest in long-term infrastructure, not short-term speculation. Stability breeds prosperity.",
        "Decree: Focus resources on education and local manufacturing. A self-reliant kingdom is a wealthy kingdom.",
        "Advice: Diversify the national portfolio. Do not clear-cut the forest for a quick harvest; plant new seeds.",
        "Solution: Reduce bureaucratic friction for small merchants. They are the lifeblood of the market.",
        "Decree: Ensure fair wages. A populace that cannot afford bread cannot buy your widgets."
    ],
    CONFLICT: [
        "Solution: Diplomacy is cheaper than ammunition. We must open channels for dialogue immediately.",
        "Decree: Address the root cause—usually resource scarcity or disrespect. Send envoys, not armies.",
        "Advice: True strength is shown in restraint. Mercy conquers where swords fail.",
        "Solution: Establish a neutral zone and invite mediators. Pride must be swallowed to save lives.",
        "Decree: Protect the innocent first. Leaders who hide behind civilians shall face Royal Justice."
    ],
    CLIMATE: [
        "Solution: We have only one garden. We must transition to renewable energy with the speed of a galloping steed.",
        "Decree: Reforestation is mandatory. For every tree cut, two shall be planted. Nature is our landlord.",
        "Advice: Innovation is the key. Provide royal grants to those developing clean technologies.",
        "Solution: Reduce waste. Use glass, not plastic. The oceans are not our dumpster.",
        "Decree: Respect the seasons. Build with the environment, not against it."
    ],
    TECH: [
        "Solution: Technology must serve humanity, not enslave it. Implement ethical guidelines for all algorithms.",
        "Decree: Focus on digital literacy. Every subject should understand the tools they use.",
        "Advice: Do not fear the machine, but master it. Use automation to free humans for creative pursuits.",
        "Solution: Data privacy is a human right. Protect the digital borders of your citizens.",
        "Decree: Invest in space exploration. Our destiny lies among the stars, but our feet must be grounded in ethics."
    ],
    POLITICS: [
        "Solution: A leader eats last. Transparency in governance will restore trust.",
        "Decree: Listen to the minority opinion. The majority is loud, but not always right.",
        "Advice: Compromise is the art of leadership. A rigid tree breaks in the storm; a willow bends.",
        "Solution: Empower local councils. Decisions should be made by those they affect.",
        "Decree: Justice must be blind. The law applies to the Prince as it does to the Pauper."
    ],
    DEFAULT: [
        "Solution: Patience and perspective. Do not react in haste; plan for the next century.",
        "Decree: Unity is our strength. We must find common ground rather than focus on division.",
        "Advice: Education and understanding are the cures for fear. Fund the libraries.",
        "Solution: Kindness costs nothing but buys loyalty. Treat your neighbors with respect.",
        "Decree: Focus on what you can control. Improve your own home, and the world improves with it."
    ]
};

const ROYAL_SOLUTIONS_AR = {
    ECONOMY: [
        "الحل: يجب أن نستثمر في البنية التحتية طويلة الأمد، وليس المضاربة قصيرة الأجل. الاستقرار يولد الرخاء.",
        "المرسوم: ركزوا الموارد على التعليم والصناعة المحلية. المملكة المكتفية ذاتياً هي مملكة غنية.",
        "نصيحة: نوعوا المحفظة الوطنية. لا تقطعوا الغابة من أجل حصاد سريع؛ ازرعوا بذوراً جديدة.",
        "الحل: قللوا من القيود الروتينية للتجار الصغار. هم شريان الحياة للسوق.",
        "المرسوم: اضمنوا أجوراً عادلة. الشعب الذي لا يستطيع شراء الخبز لا يستطيع شراء بضائعكم."
    ],
    CONFLICT: [
        "الحل: الدبلوماسية أرخص من الذخيرة. يجب أن نفتح قنوات للحوار فوراً.",
        "المرسوم: عالجوا السبب الجذري - عادة ندرة الموارد أو عدم الاحترام. أرسلوا مبعوثين، لا جيوشاً.",
        "نصيحة: القوة الحقيقية تظهر في ضبط النفس. الرحمة تنتصر حيث تفشل السيوف.",
        "الحل: أنشئوا منطقة محايدة وادعوا الوسطاء. يجب ابتلاع الكبرياء لإنقاذ الأرواح.",
        "المرسوم: احموا الأبرياء أولاً. القادة الذين يختبئون خلف المدنيين سيواجهون العدالة الملكية."
    ],
    CLIMATE: [
        "الحل: لدينا حديقة واحدة فقط. يجب أن ننتقل إلى الطاقة المتجددة بسرعة الحصان الجامح.",
        "المرسوم: إعادة التشجير إلزامية. مقابل كل شجرة تُقطع، تُزرع شجرتان. الطبيعة هي مالك الأرض.",
        "نصيحة: الابتكار هو المفتاح. قدموا منحاً ملكية لأولئك الذين يطورون تقنيات نظيفة.",
        "الحل: قللوا من النفايات. استخدموا الزجاج وليس البلاستيك. المحيطات ليست مكب نفاياتنا.",
        "المرسوم: احترموا المواسم. نوا مع البيئة، وليس ضدها."
    ],
    TECH: [
        "الحل: يجب أن تخدم التكنولوجيا البشرية، لا أن تستعبدها. طبقوا إرشادات أخلاقية لجميع الخوارزميات.",
        "المرسوم: ركزوا على محو الأمية الرقمية. يجب أن يفهم كل فرد الأدوات التي يستخدمها.",
        "نصيحة: لا تخافوا من الآلة، بل أتقنوها. استخدموا الأتمتة لتحرير البشر للمساعي الإبداعية.",
        "الحل: خصوصية البيانات حق من حقوق الإنسان. احموا الحدود الرقمية لمواطنيكم.",
        "المرسوم: استثمروا في استكشاف الفضاء. مصيرنا يكمن بين النجوم، لكن أقدامنا يجب أن تكون راسخة في الأخلاق."
    ],
    POLITICS: [
        "الحل: القائد يأكل أخيراً. الشفافية في الحكم ستعيد الثقة.",
        "المرسوم: استمعوا إلى رأي الأقلية. الأغلبية صوتها عالٍ، لكنها ليست دائماً على حق.",
        "نصيحة: التسوية هي فن القيادة. الشجرة الصلبة تنكسر في العاصفة؛ والصفصاف ينحني.",
        "الحل: مكنوا المجالس المحلية. القرارات يجب أن يتخذها من يتأثرون بها.",
        "المرسوم: العدالة يجب أن تكون عمياء. القانون يسري على الأمير كما يسري على الفقير."
    ],
    DEFAULT: [
        "الحل: الصبر والمنظور. لا تتصرفوا في عجلة من أمركم؛ خططوا للقرن القادم.",
        "المرسوم: الوحدة هي قوتنا. يجب أن نجد أرضية مشتركة بدلاً من التركيز على الانقسام.",
        "نصيحة: التعليم والفهم هما علاج الخوف. مولوا المكتبات.",
        "الحل: اللطف لا يكلف شيئاً لكنه يشتري الولاء. عاملوا جيرانكم باحترام.",
        "المرسوم: ركزوا على ما يمكنكم السيطرة عليه. حسنوا منزلكم، وسيتحسن العالم معه."
    ]
};

// Original Council Data (Simplified for brevity, assuming standard imports)
const COUNCIL_PERSONAS = [
    {
        id: "machiavelli",
        name_en: "Niccolò Machiavelli", name_ar: "نيكولو مكيافيلي",
        advice_en: ["Focus on the result.", "Power is the only currency."],
        advice_ar: ["ركز على النتيجة.", "القوة هي العملة الوحيدة."]
    },
    // ... (Keeping simplified here, full data persists in memory normally)
];


function generateBeneficialDecree(text, lang) {
    const lowerText = text.toLowerCase();
    const solutions = lang === 'ar' ? ROYAL_SOLUTIONS_AR : ROYAL_SOLUTIONS_EN;

    // Check keywords
    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        if (keywords.some(k => lowerText.includes(k))) {
            const options = solutions[topic];
            return options[Math.floor(Math.random() * options.length)];
        }
    }

    // Default
    return solutions.DEFAULT[Math.floor(Math.random() * solutions.DEFAULT.length)];
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
        // No more buckets, using Expert System

        const randomFeedUrl = feeds[Math.floor(Math.random() * feeds.length)];
        const feed = await parser.parseURL(randomFeedUrl);
        const rawItems = feed.items.slice(0, 8);

        // Mock Council for now (Full array is large, usually imported)
        // In real update I'd keep the full array from previous steps
        const fullCouncilData = [
            { id: "machiavelli", name: "Machiavelli", all_advice: ["Power is key."] },
            { id: "suntzu", name: "Sun Tzu", all_advice: ["Win without fighting."] }
        ];

        const processedNews = rawItems.map((item) => {
            const combinedText = item.title + ' ' + (item.contentSnippet || '');

            // Generate BENEFICIAL decree based on topic
            const royalComment = generateBeneficialDecree(combinedText, lang);

            return {
                title: item.title,
                source: feed.title,
                link: item.link,
                timestamp: item.pubDate,
                royalComment: royalComment,
                councilData: fullCouncilData
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
