// fitness-ai-backend/controllers/ttsCtrl.js
const https = require('https');

// Cache âm thanh đã sinh để phản hồi tức thì (<5ms)
const audioCache = new Map();
const MAX_CACHE_SIZE = 200;

/**
 * Chuẩn hóa các thuật ngữ Gym tiếng Anh / viết tắt sang phiên âm tiếng Việt dễ đọc, tự nhiên
 */
function normalizeFitnessText(rawText) {
    if (!rawText) return '';
    let text = rawText;

    const replacements = [
        [/\bPT\b/gi, 'Pi-Ti'],
        [/\b(\d+)\s*kg\b/gi, '$1 ki lô gam'],
        [/\b(\d+)\s*g\b/gi, '$1 gam'],
        [/\b(\d+)\s*kcal\b/gi, '$1 ca-lo'],
        [/\b(\d+)\s*cal\b/gi, '$1 ca-lo'],
        [/\b(\d+)\s*reps?\b/gi, '$1 lần'],
        [/\b(\d+)\s*sets?\b/gi, '$1 hiệp'],
        [/\b(\d+)\s*s\b/gi, '$1 giây'],
        [/\b(\d+)\s*sec\b/gi, '$1 giây'],
        [/\bSquat\b/gi, 'S-quát'],
        [/\bBench Press\b/gi, 'Ben-chơ rét'],
        [/\bDeadlift\b/gi, 'Đét-líp'],
        [/\bOverhead Press\b/gi, 'âu-vơ-hét rét'],
        [/\bPush-up\b/gi, 'hít đất'],
        [/\bPull-up\b/gi, 'hít xà đơn'],
        [/\bLat Pulldown\b/gi, 'kéo xô'],
        [/\bBicep Curl\b/gi, 'cuộn tay trước'],
        [/\bPlank\b/gi, 'p-lăng'],
        [/\bWhey Protein\b/gi, 'Quây Prô-tê-in'],
        [/\bWhey\b/gi, 'Quây'],
        [/\bCreatine\b/gi, 'C-rê-a-tin'],
        [/\bEat Clean\b/gi, 'Ít Clin'],
        [/\bMacro\b/gi, 'Mác-crô'],
        [/\bTDEE\b/gi, 'T D E E'],
        [/\bRPE\b/gi, 'R P E'],
        [/\bCompound\b/gi, 'com-pao'],
        [/\bDeficit\b/gi, 'thâm hụt'],
        [/\bSurplus\b/gi, 'dư thừa'],
        [/\bHypertrophy\b/gi, 'phì đại cơ bắp']
    ];

    replacements.forEach(([pattern, replacement]) => {
        text = text.replace(pattern, replacement);
    });

    // Làm sạch các ký tự đặc biệt thừa
    text = text.replace(/[#*_~`]/g, '').trim();
    return text;
}

/**
 * Tải 1 đoạn audio chunk từ Google TTS tiếng Việt (tối đa 180 ký tự)
 */
function fetchChunk(chunkText) {
    return new Promise((resolve, reject) => {
        const url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=' + encodeURIComponent(chunkText);
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`TTS service returned HTTP ${res.statusCode}`));
            }
            const data = [];
            res.on('data', c => data.push(c));
            res.on('end', () => resolve(Buffer.concat(data)));
        }).on('error', reject);
    });
}

/**
 * Chia đoạn văn dài thành các câu nhỏ vừa vặn với TTS
 */
function splitIntoChunks(text, maxLength = 160) {
    const rawSentences = text.match(/[^.!?\n,]+[.!?\n,]*/g) || [text];
    const chunks = [];
    let current = '';

    for (const sentence of rawSentences) {
        if ((current + sentence).length <= maxLength) {
            current += sentence;
        } else {
            if (current.trim()) chunks.push(current.trim());
            current = sentence;
        }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.length > 0 ? chunks : [text.slice(0, maxLength)];
}

/**
 * API GET /api/tts?text=...
 */
async function textToSpeech(req, res) {
    try {
        const rawText = req.query.text || '';
        if (!rawText.trim()) {
            return res.status(400).json({ error: 'Text query parameter is required' });
        }

        const normalized = normalizeFitnessText(rawText);
        const cacheKey = normalized.slice(0, 300);

        if (audioCache.has(cacheKey)) {
            const cachedBuf = audioCache.get(cacheKey);
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.send(cachedBuf);
        }

        const chunks = splitIntoChunks(normalized, 160);
        // Giới hạn đọc tối đa 6 chunks (~1000 ký tự) để phản hồi nhanh
        const limitedChunks = chunks.slice(0, 6);

        const audioBuffers = await Promise.all(limitedChunks.map(chunk => fetchChunk(chunk)));
        const combined = Buffer.concat(audioBuffers);

        if (audioCache.size >= MAX_CACHE_SIZE) {
            const firstKey = audioCache.keys().next().value;
            audioCache.delete(firstKey);
        }
        audioCache.set(cacheKey, combined);

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Content-Length', combined.length);
        return res.send(combined);
    } catch (err) {
        console.error('Lỗi TTS:', err.message);
        return res.status(500).json({ error: 'Lỗi tổng hợp giọng nói', details: err.message });
    }
}

module.exports = { textToSpeech, normalizeFitnessText };
