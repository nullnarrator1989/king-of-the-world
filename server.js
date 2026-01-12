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

// --- AUTHENTIC INSIGHT ENGINE (Philosopher King) ---

// 1. UNIVERSAL WISDOM LIBRARY (Concepts -> Timeless Principles)
const WISDOM_EN = {
    CONFLICT: [
        "Conflict is the failure of imagination. True victory is winning without drawing a blade.",
        "Peace is not the absence of war, but the presence of justice. We must build the former to secure the latter.",
        "Force is a temporary solution to a permanent problem. Only dialogue builds lasting foundations.",
        "The warrior who fights for anger defeats himself. The warrior who fights for protection is invincible."
    ],
    ECONOMY: [
        "Value is a belief system. When trust falters, markets crumble. Invest in trust.",
        "Prosperity that excludes the many is not prosperity; it is theft. The economy must serve the people.",
        "True wealth is not gold, but the capacity to produce. A skilled population is the treasury of the nation.",
        "Inflation is a tax on the future. We must balance our needs today with our obligations to tomorrow."
    ],
    LEADERSHIP: [ // Politics, Elections, Laws
        "A leader who fears the people is no leader at all. Authority flows from consent, not command.",
        "The noise of the majority often drowns out the wisdom of the few. A King must listen to the silence.",
        "Laws are like spiderwebs; the strong break them, the weak get caught. We must strengthen the web.",
        "Power reveals character. Watch how they treat the powerless, and you will see their true face."
    ],
    SCIENCE: [ // Tech, AI, Space, Climate
        "Discovery is the highest form of conquest. To understand the universe is to rule it.",
        "Nature is not a resource to be exploited, but a partner to be respected. We ignore her laws at our peril.",
        "Innovation without ethics is a wild beast. We must hold the leash tight.",
        "The machine should be the servant of the mind, never its master. Humanity must remain the architect."
    ],
    TRAGEDY: [ // Disasters, Accidents, Deaths
        "In the face of loss, we find our common humanity. Grief is the price we pay for love.",
        "To rebuild is the most defiant act of the human spirit. We shall rise from the ashes.",
        "Life is fleeting. Let this tragedy remind us to make our own contributions meaningful while we can."
    ],
    UNKOWN: [ // Generic / Fallback
        "Change is the only constant. We must flow with the river of time, not swim against it.",
        "Wisdom is knowing what you do not know. We must approach this new development with humble eyes.",
        "History rhymes. We have seen this before, and we can learn from those who walked this path."
    ]
};

const WISDOM_AR = {
    CONFLICT: [
        "الصراع هو فشل للخيال. النصر الحقيقي هو الفوز دون استلال سيف.",
        "السلام ليس غياب الحرب، بل حضور العدالة. يجب أن نبني الأول لضمان الثاني.",
        "القوة حل مؤقت لمشكلة دائمة. الحوار فقط هو الذي يبني أسساً دائمة.",
        "المحارب الذي يقاتل بحقد يهزم نفسه. المحارب الذي يقاتل للحماية لا يُقهر."
    ],
    ECONOMY: [
        "القيمة نظام إيمان. عندما تتزعزع الثقة، تنهار الأسواق. استثمروا في الثقة.",
        "الازدهار الذي يستثني الكثيرين ليس ازدهاراً؛ إنه سرقة. يجب أن يخدم الاقتصاد الناس.",
        "الثروة الحقيقية ليست الذهب، بل القدرة على الإنتاج. السكان المهرة هم خزانة الأمة.",
        "التضخم ضريبة على المستقبل. يجب أن نوازن احتياجاتنا اليوم مع التزاماتنا للغد."
    ],
    LEADERSHIP: [
        "القائد الذي يخاف شعبه ليس قائداً على الإطلاق. السلطة تنبع من الرضا، لا من الأمر.",
        "ضجيج الأغلبية غالباً ما يغرق حكمة القلة. يجب على الملك أن يستمع للصمت.",
        "القوانين مثل شباك العنكبوت؛ الأقوياء يمزقونها، والضعفاء يعلقون بها. يجب أن نقوي الشبكة.",
        "السلطة تكشف الشخصية. راقب كيف يعاملون الضعفاء، وسترى وجههم الحقيقي."
    ],
    SCIENCE: [
        "الاكتشاف هو أسمى أشكال الغزو. فهم الكون هو حكمه.",
        "الطبيعة ليست مورداً للاستغلال، بل شريك يجب احترامه. نتجاهل قوانينها على مسؤوليتنا.",
        "الابتكار بلا أخلاق وحش بري. يجب أن نمسك المقود بإحكام.",
        "الآلة يجب أن تكون خادمة للعقل، وليست سيدته أبداً. يجب أن تظل الإنسانية هي المهندس."
    ],
    TRAGEDY: [
        "في مواجهة الخسارة، نجد إنسانيتنا المشتركة. الحزن هو الثمن الذي ندفعه مقابل الحب.",
        "إعادة البناء هي أكثر عمل تحدياً للروح البشرية. سننهض من بين الرماد.",
        "الحياة عابرة. دعت هذه المأساة تذكرنا بجعل مساهماتنا ذات مغزى بينما نستطيع."
    ],
    UNKOWN: [
        "التغيير هو الثابت الوحيد. يجب أن نتدفق مع نهر الزمن، لا أن نسبح ضده.",
        "الحكمة هي معرفة ما لا تعرفه. يجب أن نقترب من هذا التطور الجديد بعيون متواضعة.",
        "التاريخ يكرر نفسه. لقد رأينا هذا من قبل، ويمكننا التعلم ممن ساروا في هذا الطريق."
    ]
};

// 2. CONCEPT MAPPER (Keywords -> Concepts)
const CONCEPT_MAP = {
    CONFLICT: ['war', 'attack', 'kill', 'fight', 'military', 'army', 'bomb', 'blast', 'tension', 'nuclear', 'peace', 'truce', 'soldier', 'gun', 'gaza', 'ukraine', 'russia', 'israel'],
    ECONOMY: ['economy', 'market', 'bank', 'inflation', 'stock', 'trade', 'money', 'crypto', 'bitcoin', 'tax', 'debt', 'finance', 'dollar', 'euro', 'oil', 'gold'],
    LEADERSHIP: ['president', 'minister', 'election', 'vote', 'law', 'court', 'government', 'congress', 'parliament', 'politic', 'leader', 'trump', 'biden', 'un', 'eu'],
    SCIENCE: ['science', 'tech', 'ai', 'robot', 'space', 'nasa', 'climate', 'warming', 'energy', 'planet', 'virus', 'health', 'cancer', 'data', 'internet'],
    TRAGEDY: ['dead', 'die', 'crash', 'disaster', 'quake', 'flood', 'storm', 'victim', 'killed', 'mourn']
};

// 3. SMART EXTRACTOR (Heuristic)
function extractSubject(title) {
    // A. Priority: "Quotes" (Often specific topics)
    const quoteMatch = title.match(/['"]([^'"]+)['"]/);
    if (quoteMatch && quoteMatch[1].length > 3) return quoteMatch[1];

    // B. Priority: Capitalized Phrases (Named Entities) ignoring the first word often being capitalized
    // Split title, look for contiguous capitalized words (e.g. "United States")
    const words = title.split(' ');
    // Skip first word as it's always capitalized
    let entities = [];
    let currentEntity = [];

    for (let i = 1; i < words.length; i++) {
        const w = words[i].replace(/[^\w\s]/gi, ''); // clean punctuation
        if (w && w[0] === w[0].toUpperCase() && w.length > 2) {
            currentEntity.push(w);
        } else {
            if (currentEntity.length > 0) {
                entities.push(currentEntity.join(' '));
                currentEntity = [];
            }
        }
    }
    if (currentEntity.length > 0) entities.push(currentEntity.join(' '));

    if (entities.length > 0) return entities[0]; // Return first found entity (e.g. "Elon Musk")

    // C. Fallback: First 3 meaningful words
    return words.slice(0, 3).join(' ') + '...';
}

function generateAuthenticInsight(title, lang) {
    const lowerTitle = title.toLowerCase();

    // 1. Determine Concept
    let concept = 'UNKOWN';
    for (const [key, keywords] of Object.entries(CONCEPT_MAP)) {
        if (keywords.some(k => lowerTitle.includes(k))) {
            concept = key;
            break;
        }
    }

    // 2. Select Wisdom
    const library = lang === 'ar' ? WISDOM_AR : WISDOM_EN;
    const options = library[concept];
    const wisdom = options[Math.floor(Math.random() * options.length)];

    // 3. Extract Subject for Context (The "Link" requested)
    // We append the subject to the wisdom to anchor it.
    // E.g. "Regarding 'Crypto': Value is a belief system..."
    const subject = extractSubject(title);

    const prefix = lang === 'ar' ? `بخصوص '${subject}': ` : `Regarding '${subject}': `;

    return prefix + wisdom;
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

        // Mock Council (Unchanged)
        const fullCouncilData = [
            { id: "machiavelli", name_en: "Machiavelli", name_ar: "مكيافيلي", all_advice_en: ["The end justifies the means.", "It is better to be feared."], all_advice_ar: ["الغاية تبرر الوسيلة.", "من الأفضل أن تُخشى."] },
            { id: "suntzu", name_en: "Sun Tzu", name_ar: "صن تزو", all_advice_en: ["Victory comes from knowing yourself.", "All warfare is deception."], all_advice_ar: ["النصر يأتي من معرفة الذات.", "كل الحروب خدعة."] }
        ];

        const processedNews = rawItems.map((item) => {
            // Generate AUTHENTIC INSIGHT
            const royalComment = generateAuthenticInsight(item.title, lang);

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
                royalComment: royalComment, // Now contains "Regarding 'Subject': [Deep Wisdom]"
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
