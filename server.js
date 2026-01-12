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

// --- Augmented Real Data ---

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

// Darker, Satirical Royal Reactions
const ROYAL_REACTIONS_EN = {
    NEGATIVE: [
        "The peasants are restless? Good. Anxiety burns calories.",
        "A crisis? I call it 'Spicy Tuesday'. Wake me when the fire reaches the palace.",
        "The world is ending? Finally. I was getting bored of this season.",
        "Anger is such a middle-class emotion. I prefer 'existential dread' with a side of caviar.",
        "Oh look, another disaster. Someone fetch my violin, I wish to play while it burns.",
        "I would solve this, but I am currently busy reorganizing my sock drawer by color.",
        "Chaos reigns? Excellent. It matches the drapes.",
        "Why are they screaming? Do they not have cake?"
    ],
    POSITIVE: [
        "Happiness? In this economy? Suspicious. Tax it immediately.",
        "They are celebrating? Clearly, they haven't read the fine print.",
        "Peace achieved? How dull. What will Netflix make documentaries about now?",
        "A triumph for humanity! Which creates a lot of paperwork for me. Disapproved.",
        "The world is healing? Gross. I preferred it when it was edgy.",
        "Optimism is a disease. I shall prescribe a mandatory 24-hour news cycle."
    ],
    NEUTRAL: [
        "Nothing happened? Impossible. Someone, somewhere, dropped a sandwich. Tragedy.",
        "Stagnation. My favorite form of stability.",
        "The news is 'meh'? Finally, a headline I can relate to.",
        "A slow news day is just the universe buffering before the next catastrophe.",
        "Silence? It must be the calm before the alien invasion."
    ]
};

const ROYAL_REACTIONS_AR = {
    NEGATIVE: [
        "الرعية قلقون؟ جيد. القلق يحرق السعرات الحرارية.",
        "أزمة؟ أنا أسميها 'ثلاثاء حار'. أيقظوني عندما تصل النار إلى القصر.",
        "نهاية العالم؟ أخيراً. لقد مللت من هذا الموسم.",
        "الغضب شعور طبقي جداً. أنا أفضل 'الرعب الوجودي' مع القليل من الكافيار.",
        "انظروا، كارثة أخرى. أحضروا لي الكمان، أريد أن أعزف بينما تحترق.",
        "كنت سأحل هذه المشكلة، لكنني مشغول حالياً بترتيب جواربي حسب اللون.",
        "الفوضى تعم؟ ممتاز. هذا يتناسب مع الستائر.",
        "لماذا يصرخون؟ أليس لديهم كعك؟"
    ],
    POSITIVE: [
        "سعادة؟ في هذا الاقتصاد؟ مشبوه. افرضوا عليها ضريبة فوراً.",
        "يحتفلون؟ من الواضح أنهم لم يقرؤوا الشروط والأحكام.",
        "تحقق السلام؟ يا للملل. عما ستصنع نتفليكس وثائقياتها الآن؟",
        "انتصار للبشرية! مما يخلق الكثير من المعاملات الورقية لي. مرفوض.",
        "العالم يتعافى؟ مقرف. كنت أفضله عندما كان درامياً.",
        "التفاؤل مرض. سأصف لكم دورة إخبارية إجبارية لمدة 24 ساعة."
    ],
    NEUTRAL: [
        "لم يحدث شيء؟ مستحيل. شخص ما، في مكان ما، أسقط شطيرة. مأساة.",
        "ركود. نوعي المفضل من الاستقرار.",
        "الأخبار 'عادية'؟ أخيراً، عنوان يمكنني التعاطف معه.",
        "يوم إخباري بطيء هو مجرد تحميل للكون قبل الكارثة التالية.",
        "صمت؟ لا بد أنه الهدوء الذي يسبق غزو الفضائيين."
    ]
};

// EXPANDED Council Personas
const COUNCIL_PERSONAS = [
    {
        id: "machiavelli",
        name_en: "Niccolò Machiavelli",
        name_ar: "نيكولو مكيافيلي",
        advice_en: [
            "Never mind the morality, Your Highness. Is it effective? If so, do it twice.",
            "Fear is better than love. They cannot break a contract written in fear.",
            "A wise prince keeps his friends close, and his enemies in the dungeon.",
            "Chaos is a ladder. Climb it, and kick the others off.",
            "If you must injure a man, do it so severely that his vengeance need not be feared.",
            "Politics have no relation to morals. Which is convenient for us.",
            "The vulgar crowd is always taken in by appearances. Give them a show.",
            "It is double pleasure to deceive the deceiver.",
            "One who deceives will always find those who allow themselves to be deceived.",
            "Hatred is gained as much by good works as by evil."
        ],
        advice_ar: [
            "لا تهتم بالأخلاق يا صاحب السمو. هل هو فعال؟ إذا كان كذلك، افعله مرتين.",
            "الخوف أفضل من الحب. لا يمكنهم كسر عقد مكتوب بالخوف.",
            "الأمير الحكيم يبقي أصدقاءه قريبين، وأعداءه في الزنزانة.",
            "الفوضى سلم. اصعد عليه، واركل الآخرين.",
            "إذا توجب عليك إيذاء رجل، فافعل ذلك بشدة بحيث لا تخشى انتقامه.",
            "السياسة لا علاقة لها بالأخلاق. وهذا مريح لنا.",
            "الجماهير الساذجة تنخدع دائماً بالمظاهر. أعطهم عرضاً.",
            "إنه لمتعة مضاعفة أن تخدع المخادع.",
            "من يخدع سيجد دائماً أولئك الذين يسمحون لأنفسهم بأن يُخدعوا.",
            "الكراهية تُكتسب بالأعمال الصالحة بقدر ما تُكتسب بالأعمال الشريرة."
        ]
    },
    {
        id: "suntzu",
        name_en: "Sun Tzu",
        name_ar: "صن تزو",
        advice_en: [
            "The supreme art of war is to subdue the enemy without fighting. Or just buy them.",
            "Appear weak when you are strong, and strong when you are napping.",
            "Strategy without tactics is the slowest route to victory. Tactics without strategy is just noise.",
            "Know your enemy, and know yourself. If you know neither, run.",
            "In the midst of chaos, there is also opportunity. Usually to steal something.",
            "Victory is reserved for those who are willing to pay the price. Or bribe the referee.",
            "Move swift as the Wind and closely-formed as the Wood. Attack like the Fire and be still like the Mountain.",
            "Keep your friends close, and your enemies guessing.",
            "Who wishes to fight must first count the cost. Ideally, put it on a credit card.",
            "Great results can be achieved with small forces. Like mosquitos."
        ],
        advice_ar: [
            "الفن الأسمى للحرب هو إخضاع العدو دون قتال. أو مجرد شرائهم.",
            "تظاهر بالضعف عندما تكون قوياً، وبالقوة عندما تأخذ قيلولة.",
            "الاستراتيجية بدون تكتيكات هي أبطأ طريق للنصر. التكتيكات بدون استراتيجية هي مجرد ضجيج.",
            "اعرف عدوك، واعرف نفسك. إذا لم تكن تعرف أياً منهما، اهرب.",
            "في خضم الفوضى، هناك أيضاً فرصة. عادة لسرقة شيء ما.",
            "النصر محفوظ لأولئك المستعدين لدفع الثمن. أو رشوة الحكم.",
            "تحرك بسرعة كالريح وتماسك كالخشب. هاجم كالنار واثبت كالجبل.",
            "أبقِ أصدقاءك قريبين، وأعداءك في حيرة.",
            "من يرغب في القتال يجب أن يحسب التكلفة أولاً. يفضل وضعها على بطاقة الائتمان.",
            "نتائج عظيمة يمكن تحقيقها بقوات صغيرة. مثل البعوض."
        ]
    },
    {
        id: "plato",
        name_en: "Plato",
        name_ar: "أفلاطون",
        advice_en: [
            "Reality is merely an illusion, albeit a very persistent one. Like your taxes.",
            "Wise men speak because they have something to say; fools because they have to say something.",
            "The price good men pay for indifference to public affairs is to be ruled by evil men.",
            "Perhaps we are all just shadows in a cave, dreaming of better Wi-Fi.",
            "At the touch of love everyone becomes a poet. Gross.",
            "Ignorance, the root and stem of all evil. Also, the root of all reality TV.",
            "Good people do not need laws to tell them to act responsibly, while bad people will find a way around the laws.",
            "Be kind, for everyone you meet is fighting a hard battle. Usually against their alarm clock.",
            "Thinking: the talking of the soul with itself. Stop interrupting me.",
            "Music is a moral law. Only if it's classical, of course."
        ],
        advice_ar: [
            "الواقع مجرد وهم، وإن كان مستمراً للغاية. مثل ضرائبك.",
            "الحكماء يتكلمون لأن لديهم شيئاً يقولونه؛  الحمقى لأن عليهم قول شيء ما.",
            "الثمن الذي يدفعه الطيبون مقابل اللامبالاة بالشؤون العامة هو أن يحكمهم الأشرار.",
            "ربما نحن جميعاً مجرد ظلال في كهف، نحلم بشبكة واي فاي أفضل.",
            "بلمسة من الحب يصبح الجميع شاعراً. مقرف.",
            "الجهل، جذر وأصل كل الشرور. وأيضاً، جذر كل برامج الواقع.",
            "الناس الطيبون لا يحتاجون إلى قوانين تخبرهم بالتصرف بمسؤولية، بينما الناس السيئون سيجدون طريقة للالتفاف حول القوانين.",
            "كن لطيفاً، لأن كل شخص تقابله يخوض معركة شاقة. عادةً ضد منبهه.",
            "التفكير: حديث الروح مع نفسها. توقف عن مقاطعتي.",
            "الموسيقى قانون أخلاقي. فقط لو كانت كلاسيكية، بالطبع."
        ]
    },
    {
        id: "marie",
        name_en: "Marie Antoinette",
        name_ar: "ماري أنطوانيت",
        advice_en: [
            "Let them eat cake! Or brioche. Or whatever is in the fridge.",
            "Why is everyone shouting? It ruins the ambiance of the garden party.",
            "Fashion is the only true politics. And my wig is winning.",
            "If they are hungry, can they not simply order delivery?",
            "I have seen the future, and it lacks sufficient velvet.",
            "There is nothing new except what has been forgotten. Like my other shoes.",
            "Difficulty? I do not know this word. Is it French?",
            "They say I spend too much. I say they earn too little.",
            "Courage! I have shown it for years; think you I shall lose it at the moment when my sufferings are to end?",
            "Creme brulee solves everything."
        ],
        advice_ar: [
            "ليدعهم يأكلون الكعك! أو البريوش. أو أي شيء في الثلاجة.",
            "لماذا يصرخ الجميع؟ إنه يفسد جو حفلة الحديقة.",
            "الموضة هي السياسة الحقيقية الوحيدة. وشعري المستعار هو الفائز.",
            "إذا كانوا جائعين، ألا يمكنهم ببساطة طلب التوصيل؟",
            "لقد رأيت المستقبل، وهو يفتقر إلى المخمل الكافي.",
            "لا يوجد شيء جديد سوى ما تم نسيانه. مثل حذائي الآخر.",
            "صعوبة؟ لا أعرف هذه الكلمة. هل هي فرنسية؟",
            "يقولون إنني أنفق الكثير. أقول إنهم يكسبون القليل جداً.",
            "شجاعة! لقد أظهرتها لسنوات؛ هل تعتقد أنني سأفقدها في اللحظة التي ستنتهي فيها معاناتي؟",
            "الكريم بروليه يحل كل شيء."
        ]
    },
    {
        id: "nietzsche",
        name_en: "Friedrich Nietzsche",
        name_ar: "فريدريك نيتشه",
        advice_en: [
            "God is dead. And I think I left the stove on.",
            "What does not kill me makes me stronger. Except for that lukewarm coffee.",
            "To live is to suffer, to survive is to find some meaning in the suffering. Or just complain online.",
            "When you gaze into the abyss, the abyss also gazes into you. Don't blink.",
            "He who has a why to live can bear almost any how. But not slow internet.",
            "Without music, life would be a mistake. Like your haircut.",
            "There are no facts, only interpretations. And my interpretation is that you are wrong.",
            "The individual has always had to struggle to keep from being overwhelmed by the tribe.",
            "I am not a man, I am dynamite. Kaboom.",
            "That which does not kill us makes us stronger."
        ],
        advice_ar: [
            "الإله مات. وأعتقد أنني تركت الموقد مشتعلاً.",
            "ما لا يقتلني يجعنلي أقوى. باستثناء تلك القهوة الفاترة.",
            "أن تعيش هو أن تعاني، وأن تبقى على قيد الحياة هو أن تجد معنى في المعاناة. أو مجرد الشكوى عبر الإنترنت.",
            "عندما تحدق في الهاوية، فإن الهاوية تحدق فيك أيضًا. لا ترمش.",
            "من لديه 'لماذا' يعيش من أجلها يمكنه تحمل أي 'كيف'. لكن ليس الإنترنت البطيء.",
            "بدون موسيقى، ستكون الحياة خطأ. مثل قصة شعرك.",
            "لا توجد حقائق، فقط تفسيرات. وتفسيري هو أنك مخطئ.",
            "لقد كان على الفرد دائمًا أن يكافح ليبتعد عن سيطرة القبيلة.",
            "أنا لست رجلاً، أنا ديناميت. بوم.",
            "ما لا يقتلنا يجعلنا أقوى."
        ]
    }
];

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
        const reactions = lang === 'ar' ? ROYAL_REACTIONS_AR : ROYAL_REACTIONS_EN;

        const randomFeedUrl = feeds[Math.floor(Math.random() * feeds.length)];
        const feed = await parser.parseURL(randomFeedUrl);
        // Take top 8 items now for more variety
        const rawItems = feed.items.slice(0, 8);

        const allCouncilData = COUNCIL_PERSONAS.map(ghost => ({
            id: ghost.id,
            name: lang === 'ar' ? ghost.name_ar : ghost.name_en,
            all_advice: lang === 'ar' ? ghost.advice_ar : ghost.advice_en
        }));

        const processedNews = rawItems.map((item, index) => {
            let combinedText = item.title + ' ' + (item.contentSnippet || '');
            let reactionType = Math.random() > 0.2 ? 'NEGATIVE' : (Math.random() > 0.5 ? 'NEUTRAL' : 'POSITIVE');

            if (lang === 'en') {
                const result = sentiment.analyze(combinedText);
                if (result.score <= -3) reactionType = 'NEGATIVE';
                if (result.score >= 3) reactionType = 'POSITIVE';
            }

            const comments = reactions[reactionType];
            const royalComment = comments[Math.floor(Math.random() * comments.length)];

            return {
                title: item.title,
                source: feed.title,
                link: item.link,
                timestamp: item.pubDate,
                royalComment: royalComment,
                councilData: allCouncilData
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
