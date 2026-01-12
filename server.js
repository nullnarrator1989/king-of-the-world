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

// --- ADVANCED DECREE ENGINE ---

// These generators take the specific "Subject" found in the headline and weave it into the advice.
const TEMPLATES_EN = {
    // Specific Entities
    'trump': (s) => `Donald Trump is a symptom, not the cause. The solution is not in one man, but in strengthening the institutions he challenges.`,
    'biden': (s) => `Leadership requires more than presence; it requires vision. The challenge for the administration is to unite a fractured kingdom.`,
    'china': (s) => `The Dragon rises not by chance, but by planning centuries ahead. We must learn from their patience while safeguarding our own liberty.`,
    'russia': (s) => `Strength used for aggression is weakness in disguise. True power lies in economic stability, not territorial expansion.`,
    'ukraine': (s) => `The resilience of Ukraine teaches us that the spirit of a people is stronger than steel. We must support their right to sovereignty.`,
    'un': (s) => `The UN talks while the world burns. It needs less bureaucracy and more teeth to enforce peace.`,
    'eu': (s) => `A union of nations is noble but fragile. They must remember that shared prosperity is the only glue that holds.`,
    'nato': (s) => `Alliances are necessary, but dependence is dangerous. Every nation must contribute its fair share to the common shield.`,

    // Topics / Keywords
    'war': (s) => `War is the failure of imagination. Immediate ceasefire and dialogue are the only sane paths. History honors the peacemaker, not the conqueror.`,
    'fight': (s) => `Violence breeds only more violence. The cycle must be broken by the side with the greater courage to forgive.`,
    'military': (s) => `A strong military is a shield, not a sword. It should exist to deter conflict, never to provoke it.`,

    'economy': (s) => `The economy is a garden, not a machine. You cannot force it to grow; you must water the roots (the workers) and prune the dead branches (corruption).`,
    'inflation': (s) => `Inflation is the thief of the poor. To fight it, we must produce more value locally and stop printing empty promises.`,
    'market': (s) => `The market is manic-depressive. Do not build your house on its shifting sands. Invest in land, education, and tangible goods.`,
    'crypto': (s) => `Digital currency is fascinating, but can you eat it? Real wealth is resources, food, and energy. Proceed with caution.`,
    'bank': (s) => `Banks must be servants of the people, not their masters. Excessive greed in the financial sector requires strict regulation.`,

    'climate': (s) => `Nature is sending us a bill for centuries of debt. We must pay it by transitioning to green energy now, or face foreclosure.`,
    'oil': (s) => `Oil is the blood of the past. The sun and wind are the fuel of the future. We must adapt or become fossils ourselves.`,
    'energy': (s) => `Energy independence is national security. Every roof should capture the sun; every wind should turn a turbine.`,

    'ai': (s) => `AI is a tool, like fire. It can cook our food or burn our house down. We need ethical guardrails immediately.`,
    'tech': (s) => `Technology advances faster than wisdom. We must ensure that our digital tools connect us rather than divide us.`,
    'space': (s) => `Looking to the stars is good, but we must not forget the earth under our feet. Fix the home signal before exploring the neighborhood.`,

    'election': (s) => `An election is the voice of the soul of a nation. The winner must serve all, not just those who voted for them.`,
    'protest': (s) => `A protest is a fever alerting us to an infection in the body politic. Leaders must listen to the symptoms, not suppress them.`,
    'law': (s) => `The law must be a wall for the weak against the strong. If it serves only the rich, it is not law, but oppression.`,

    // Catch-alls (Dynamic)
    'crisis': (s) => `Every crisis carries the seed of opportunity. In this moment of difficulty, we must find the strength to reinvent ourselves.`,
    'new': (s) => `Novelty is exciting, but is it progress? We must judge '${s}' not by its newness, but by its utility to humanity.`,
    'dead': (s) => `We mourn the loss. It reminds us that life is fleeting, and we must make our own contributions meaningful while we can.`,
};

const TEMPLATES_AR = {
    // Specific Entities
    'trump': (s) => `ترامب هو عَرَض وليس السبب. الحل ليس في رجل واحد، بل في تعزيز المؤسسات التي يتحداها.`,
    'biden': (s) => `القيادة تتطلب أكثر من الحضور؛ تتطلب رؤية. التحدي أمام الإدارة هو توحيد مملكة ممزقة.`,
    'china': (s) => `التنين لا ينهض بالصدفة، بل بالتخطيط لقرون قادمة. يجب أن نتعلم من صبرهم مع حماية حريتنا.`,
    'russia': (s) => `القوة المستخدمة للعدوان هي ضعف مقنع. القوة الحقيقية تكمن في الاستقرار الاقتصادي، لا التوسع الإقليمي.`,
    'ukraine': (s) => `صمود أوكرانيا يعلمنا أن روح الشعب أقوى من الفولاذ. يجب أن ندعم حقهم في السيادة.`,
    'un': (s) => `الأمم المتحدة تتحدث بينما العالم يحترق. إنها بحاجة إلى بيروقراطية أقل وأنياب أكثر لفرض السلام.`,

    // Topics
    'war': (s) => `الحرب هي فشل للخيال. وقف إطلاق النار الفوري والحوار هما المساران الوحيدان للعقل. التاريخ يكرم صانع السلام، لا الفاتح.`,
    'economy': (s) => `الاقتصاد حديقة وليس آلة. لا يمكنك إجباره على النمو؛ يجب أن تروي الجذور (العمال) وتقلم الفروع الميتة (الفساد).`,
    'inflation': (s) => `التضخم هو لص الفقراء. لمحاربته، يجب أن ننتج قيمة أكبر محلياً ونتوقف عن طباعة الوعود الفارغة.`,
    'market': (s) => `السوق متقلب المزاج. لا تبنِ منزلك على رماله المتحركة. استثمر في الأرض والتعليم والسلع الملموسة.`,
    'climate': (s) => `الطبيعة ترسل لنا فاتورة لقرون من الديون. يجب أن ندفعها بالانتقال إلى الطاقة الخضراء الآن، أو مواجهة الإفلاس.`,
    'oil': (s) => `النفط هو دم الماضي. الشمس والرياح هما وقود المستقبل. يجب أن نتكيف أو نصبح أحافير بأنفسنا.`,
    'ai': (s) => `الذكاء الاصطناعي أداة، مثل النار. يمكنه طهي طعامنا أو حرق منزلنا. نحتاج إلى حواجز أخلاقية فوراً.`,
    'tech': (s) => `تتقدم التكنولوجيا أسرع من الحكمة. يجب أن نضمن أن أدواتنا الرقمية تربطنا بدلاً من أن تفرقنا.`,
    'election': (s) => `الانتخابات هي صوت روح الأمة. يجب على الفائز أن يخدم الجميع، وليس فقط من صوتوا له.`,
    'protest': (s) => `الاحتجاج هو حمى تنبهنا إلى عدوى في الجسد السياسي. يجب على القادة الاستماع إلى الأعراض، لا قمعها.`,

    // Catch-alls
    'crisis': (s) => `كل أزمة تحمل بذرة فرصة. في لحظة الصعوبة هذه، يجب أن نجد القوة لإعادة اختراع أنفسنا.`,
    'new': (s) => `الجديد مثير، لكن هل هو تقدم؟ يجب أن نحكم على '${s}' ليس بجدته، ولكن بفائدته للبشرية.`
};

const DEFAULT_ADVICE_EN = [
    (s) => `Regarding '${s}': We must approach this with caution and wisdom. Hasty reactions lead to regret.`,
    (s) => `The situation with '${s}' is complex. Let us not seek simple answers to difficult questions.`,
    (s) => `In matters of '${s}', transparency is key. The truth must be brought to light.`,
    (s) => `We must monitor '${s}' closely. It has the potential to reshape our world.`
];

const DEFAULT_ADVICE_AR = [
    (s) => `بخصوص '${s}': يجب أن نتعامل مع هذا بحذر وحكمة. ردود الفعل المتسرعة تؤدي إلى الندم.`,
    (s) => `الوضع مع '${s}' معقد. دعونا لا نبحث عن إجابات بسيطة لأسئلة صعبة.`,
    (s) => `في مسائل '${s}'، الشفافية هي المفتاح. يجب كشف الحقيقة.`,
    (s) => `يجب أن نراقب '${s}' عن كثب. لديه القدرة على إعادة تشكيل عالمنا.`
];


function generateContextualDecree(title, lang) {
    const lowerTitle = title.toLowerCase();
    const templates = lang === 'ar' ? TEMPLATES_AR : TEMPLATES_EN;
    const defaults = lang === 'ar' ? DEFAULT_ADVICE_AR : DEFAULT_ADVICE_EN;

    // 1. Identify Subject (Simple Extraction)
    // Try to find a known keyword match first
    let matchedKeyword = null;
    for (const key of Object.keys(templates)) {
        if (lowerTitle.includes(key)) {
            matchedKeyword = key;
            break;
        }
    }

    // Extract a "display subject" for the template
    // If no keyword match, try to grab the first capitalized word or proper noun roughly
    let displaySubject = "this matter";
    if (matchedKeyword) {
        displaySubject = matchedKeyword; // Use the specific keyword logic
        return templates[matchedKeyword](displaySubject);
    } else {
        // Fallback Extraction: Grab the first 3 words of the title as the subject
        const words = title.split(' ');
        displaySubject = words.slice(0, 3).join(' ') + '...';

        // Use a generic template but inject the subject
        return defaults[Math.floor(Math.random() * defaults.length)](displaySubject);
    }
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
            { id: "machiavelli", name_en: "Machiavelli", name_ar: "مكيافيلي", all_advice_en: ["Seize the opportunity.", "Chaos is a ladder."], all_advice_ar: ["اغتنم الفرصة.", "الفوضى هي سلم."] },
            { id: "plato", name_en: "Plato", name_ar: "أفلاطون", all_advice_en: ["The unexamined life is not worth living.", "Truth is beauty."], all_advice_ar: ["الحياة غير المختبرة لا تستحق العيش.", "الحقيقة هي الجمال."] }
        ];

        const processedNews = rawItems.map((item) => {
            const combinedText = item.title; // Focus on title for keyword matching

            // Generate CONTEXTUAL decree
            const royalComment = generateContextualDecree(combinedText, lang);

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
