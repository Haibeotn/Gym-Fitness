// src/services/audioCoach.js
/**
 * AI Audio Coach & Synthesizer Engine
 * Powered by Natural Vietnamese Neural Voice TTS (Backend Streaming)
 * with Instant Web Speech API & Web Audio FX Fallback
 */

class AudioCoachEngine {
    constructor() {
        this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
        this.audioCtx = null;
        this.currentAudio = null;
        this.enabled = true;
        this.soundFxEnabled = true;
        this.voiceType = 'coach_female'; // Mặc định giọng Coach Nữ Đào Chi
        this.volume = 1.0;
        this.speaking = false;
        this.speakingMsgId = null;
        this.onStateChangeCallbacks = [];

        // Exercise knowledge base for instant form cues in Vietnamese
        this.formTips = {
            'barbell bench press': 'Giữ 5 điểm tiếp xúc: đầu, vai, mông áp sát ghế và 2 bàn chân bám chặt sàn. Ép xương bả vai, hít sâu khi hạ tạ chạm ngực dưới và thở mạnh khi đẩy lên!',
            'dumbbell bench press': 'Kiểm soát biên độ hạ tạ ngang ngực, không để tạ chạm nhau ở đỉnh chuyển động để duy trì áp lực liên tục lên cơ ngực.',
            'incline dumbbell press': 'Chỉnh ghế nghiêng khoảng 30 đến 45 độ, tập trung cảm nhận nhóm ngực trên, tránh ưỡn lưng quá mức.',
            'push-up': 'Siết chặt cơ mông và cơ bụng tạo thành một đường thẳng từ gót chân đến đầu. Khuỷu tay khép góc 45 độ so với thân.',
            'squat': 'Mở rộng chân bằng vai, mũi chân xoay nhẹ ra ngoài 15 độ. Đẩy hông ra sau như ngồi xuống ghế, giữ thẳng lưng và đầu gối mở theo hướng mũi chân.',
            'deadlift': 'Thanh đòn sát cẳng chân, ưỡn ngực kéo vai về sau. Đạp sàn bằng gót chân kết hợp duỗi hông dứt khoát!',
            'lat pulldown': 'Ngả người nhẹ khoảng 10 độ, kéo thanh đòn về chạm xương quai xanh bằng lực kéo của cơ lưng xô, không giật lưng.',
            'pull-up': 'Treo người thẳng tay, siết bả vai trước khi kéo người lên sao cho cằm vượt qua xà đơn.',
            'bicep curl': 'Cố định khuỷu tay sát sườn, chỉ gập cẳng tay và siết chặt cơ bắp tay trước ở đỉnh 1 giây.',
            'overhead press': 'Đứng vững, siết mông và bụng. Đẩy thanh tạ thẳng đứng qua đầu và khóa khớp vai an toàn.',
            'plank': 'Giữ thẳng toàn thân, siết chặt bụng và thở đều từng nhịp. Đừng để võng lưng dưới!'
        };
    }

    // Lazy init Web Audio Context upon user interaction
    getAudioContext() {
        if (!this.audioCtx && typeof window !== 'undefined') {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.audioCtx = new AudioContextClass();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    subscribe(callback) {
        this.onStateChangeCallbacks.push(callback);
        return () => {
            this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter(cb => cb !== callback);
        };
    }

    notify() {
        this.onStateChangeCallbacks.forEach(cb => cb({
            speaking: this.speaking,
            speakingMsgId: this.speakingMsgId,
            enabled: this.enabled,
            soundFxEnabled: this.soundFxEnabled,
            voiceType: this.voiceType,
            volume: this.volume
        }));
    }

    setSettings({ enabled, soundFxEnabled, voiceType, volume }) {
        if (enabled !== undefined) this.enabled = enabled;
        if (soundFxEnabled !== undefined) this.soundFxEnabled = soundFxEnabled;
        if (voiceType !== undefined) this.voiceType = voiceType;
        if (volume !== undefined) {
            this.volume = Math.max(0, Math.min(1, volume));
            if (this.currentAudio) this.currentAudio.volume = this.volume;
        }
        this.notify();
    }

    // ==================== WEB AUDIO SOUND EFFECTS (BEEPS & CHIMES) ====================
    playBeep(freq = 600, duration = 0.15, type = 'sine') {
        if (!this.soundFxEnabled) return;
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn('Audio SFX error:', e);
        }
    }

    playCountdownBeep(isFinal = false) {
        if (isFinal) {
            this.playBeep(1200, 0.4, 'triangle'); // High celebratory beep for 0s / start
        } else {
            this.playBeep(800, 0.12, 'sine'); // Standard tick beep
        }
    }

    playVictoryChime() {
        if (!this.soundFxEnabled) return;
        try {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    this.playBeep(freq, 0.25, 'triangle');
                }, i * 140);
            });
        } catch (e) {
            console.warn('Victory chime error:', e);
        }
    }

    // ==================== NATURAL VIETNAMESE TTS (NEURAL STREAMING) ====================
    cleanTextForSpeech(text) {
        if (!text) return '';
        return text
            // Gỡ bỏ icon, emojis
            .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
            // Gỡ markdown bold/italic/links
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[*_~`#>]/g, '')
            .replace(/\n+/g, '. ')
            .trim();
    }

    getBestVietnameseVoice() {
        if (!this.synth) return null;
        const voices = this.synth.getVoices();
        const viVoices = voices.filter(v => 
            v.lang.startsWith('vi') || 
            v.lang.includes('VIE') || 
            v.name.toLowerCase().includes('vietnam') || 
            v.name.toLowerCase().includes('vietnamese')
        );

        if (viVoices.length > 0) {
            // Ưu tiên giọng Natural / Neural nếu có
            const natural = viVoices.find(v => v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('online'));
            if (natural) return natural;

            if (this.voiceType === 'coach_female') {
                return viVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('hoaimy') || v.name.toLowerCase().includes('mai') || v.name.toLowerCase().includes('linh')) || viVoices[0];
            } else {
                return viVoices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('nam') || v.name.toLowerCase().includes('tuan')) || viVoices[0];
            }
        }
        return null;
    }

    speakFallback(text) {
        if (!this.synth) return;
        const chosenVoice = this.getBestVietnameseVoice();
        // Nếu không có voice tiếng Việt nào trên máy thì không đọc bằng voice tiếng Anh để tránh phát âm máy móc
        if (!chosenVoice) {
            console.warn('Không tìm thấy voice Tiếng Việt offline trên trình duyệt.');
            return;
        }

        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'vi-VN';
            utterance.volume = this.volume;
            utterance.voice = chosenVoice;

            if (this.voiceType === 'coach_female') {
                utterance.pitch = 1.1;
                utterance.rate = 1.0;
            } else {
                utterance.pitch = 0.95;
                utterance.rate = 1.05;
            }

            utterance.onstart = () => {
                this.speaking = true;
                this.notify();
            };
            utterance.onend = () => {
                this.speaking = false;
                this.speakingMsgId = null;
                this.notify();
            };
            utterance.onerror = () => {
                this.speaking = false;
                this.speakingMsgId = null;
                this.notify();
            };

            this.synth.speak(utterance);
        } catch (e) {
            console.warn('SpeechSynthesis fallback error:', e);
        }
    }

    async speak(text, priority = false, msgId = null) {
        if (!this.enabled || !text) return;

        if (priority || this.speaking) {
            this.stop();
        }

        const cleaned = this.cleanTextForSpeech(text);
        if (!cleaned) return;

        this.speakingMsgId = msgId;

        // Ưu tiên 1: Gọi Backend TTS để phát âm thanh Tiếng Việt tự nhiên chất lượng cao
        try {
            const audioUrl = `http://localhost:3000/api/tts?text=${encodeURIComponent(cleaned)}`;
            const audio = new Audio(audioUrl);
            audio.volume = this.volume;

            // Tinh chỉnh tốc độ theo hình tượng HLV
            if (this.voiceType === 'coach_female') {
                audio.playbackRate = 1.05;
            } else {
                audio.playbackRate = 1.0;
            }

            this.currentAudio = audio;
            this.speaking = true;
            this.notify();

            audio.onended = () => {
                this.speaking = false;
                this.speakingMsgId = null;
                this.currentAudio = null;
                this.notify();
            };

            audio.onerror = (err) => {
                console.warn('Lỗi Audio stream TTS backend, chuyển sang Web Speech:', err);
                this.currentAudio = null;
                this.speakFallback(cleaned);
            };

            await audio.play();
        } catch (err) {
            console.warn('Không thể phát Audio tự nhiên, fallback:', err);
            this.speakFallback(cleaned);
        }
    }

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        if (this.synth) {
            this.synth.cancel();
        }
        this.speaking = false;
        this.speakingMsgId = null;
        this.notify();
    }

    // ==================== SMART COACHING PHRASES ====================
    speakExerciseForm(exerciseName) {
        const lower = exerciseName.toLowerCase();
        let matchedTip = '';
        for (const [key, tip] of Object.entries(this.formTips)) {
            if (lower.includes(key)) {
                matchedTip = tip;
                break;
            }
        }

        if (matchedTip) {
            this.speak(`Hướng dẫn form bài ${exerciseName}: ${matchedTip}`, true);
        } else {
            this.speak(`Chuẩn bị bài ${exerciseName}! Hãy giữ thẳng cột sống, gồng chắc cơ bụng và kiểm soát tốc độ tạ trong suốt hiệp tập!`, true);
        }
    }

    speakSetStart(exerciseName, setNumber, weight, reps) {
        const phrases = [
            `Bắt đầu hiệp ${setNumber} bài ${exerciseName}, mức tạ ${weight} ký, mục tiêu ${reps} lần. Tập trung tối đa và bùng nổ nào!`,
            `Vào vị trí hiệp ${setNumber}! Mức tạ ${weight} ký. Hít sâu, kiểm soát nhịp đi xuống 2 giây!`,
            `Hiệp số ${setNumber} bắt đầu! Khóa chắc khớp và đẩy dứt khoát!`
        ];
        const phrase = phrases[(setNumber - 1) % phrases.length];
        this.speak(phrase, true);
    }

    speakRestStart(seconds = 60) {
        const phrases = [
            `Hoàn thành hiệp tập xuất sắc! Bạn có ${seconds} giây nghỉ ngơi. Uống một ngụm nước và hít thở sâu nhé.`,
            `Tốt lắm! Nghỉ ${seconds} giây để cơ bắp phục hồi năng lượng sẵn sàng cho hiệp tiếp theo.`,
            `Tuyệt vời! Thời gian nghỉ ${seconds} giây bắt đầu. Thả lỏng cơ thể nào!`
        ];
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        this.speak(phrase, true);
    }

    speakRestCountdown(sec) {
        if (sec <= 5 && sec > 0) {
            this.playCountdownBeep(false);
            if (sec === 5) {
                this.speak('Năm giây nữa, chuẩn bị vào hiệp!', true);
            }
        } else if (sec === 0) {
            this.playCountdownBeep(true);
            this.speak('Hết giờ nghỉ! Vào hiệp mới ngay nào!', true);
        }
    }

    speakWorkoutCompleted(volumeKg, totalSets, durationText) {
        this.playVictoryChime();
        const text = `Chúc mừng bạn đã hoàn thành xuất sắc buổi tập hôm nay! Thời gian ${durationText}, hoàn thành ${totalSets} hiệp với tổng khối lượng tạ ${Number(volumeKg).toLocaleString()} ký. Bạn đã làm rất tuyệt vời!`;
        this.speak(text, true);
    }
}

// Global Singleton
const audioCoach = new AudioCoachEngine();
export default audioCoach;

