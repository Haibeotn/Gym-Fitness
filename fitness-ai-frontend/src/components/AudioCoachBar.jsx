// src/components/AudioCoachBar.jsx
import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Mic, Play, Sliders, Bell } from 'lucide-react';
import audioCoach from '../services/audioCoach';

export default function AudioCoachBar({ currentExercise = '' }) {
    const [coachState, setCoachState] = useState({
        speaking: audioCoach.speaking,
        enabled: audioCoach.enabled,
        soundFxEnabled: audioCoach.soundFxEnabled,
        voiceType: audioCoach.voiceType,
        volume: audioCoach.volume
    });
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        const unsubscribe = audioCoach.subscribe((newState) => {
            setCoachState({ ...newState });
        });
        return unsubscribe;
    }, []);

    const toggleVoice = () => {
        audioCoach.setSettings({ enabled: !coachState.enabled });
        if (!coachState.enabled) {
            audioCoach.speak('Đã bật trợ lý giọng nói HLV ảo!', true);
        } else {
            audioCoach.stop();
        }
    };

    const toggleSoundFx = () => {
        audioCoach.setSettings({ soundFxEnabled: !coachState.soundFxEnabled });
        if (!coachState.soundFxEnabled) {
            audioCoach.playCountdownBeep(true);
        }
    };

    const handleVoiceChange = (type) => {
        audioCoach.setSettings({ voiceType: type });
        if (type === 'coach_female') {
            audioCoach.speak('Chào bạn! Mình là Coach Đào Chi, sẽ luôn đồng hành và nhắc nhở bạn giữ form thật chuẩn xác trong từng hiệp tập nhé!', true);
        } else {
            audioCoach.speak('Chào bạn! Tôi là Huấn luyện viên nam, sẵn sàng bùng nổ cùng bạn trong từng hiệp tập!', true);
        }
    };

    const handleTestVoice = () => {
        if (currentExercise) {
            audioCoach.speakExerciseForm(currentExercise);
        } else {
            audioCoach.speak('Xin chào! Mình là Coach Đào Chi - Huấn Luyện Viên AI của bạn. Hãy giữ chắc cơ bụng và cùng nhau bùng nổ buổi tập hôm nay nhé!', true);
        }
    };

    return (
        <div className="shrink-0 w-full bg-slate-50/95 dark:bg-slate-800/95 border-2 border-indigo-500/40 rounded-2xl p-3.5 sm:p-4 shadow-xl backdrop-blur relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left: Status & Speaking Indicator */}
                <div className="flex items-center gap-3">
                    <div className={`shrink-0 relative p-2.5 rounded-xl border transition-all ${
                        coachState.speaking 
                            ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/20' 
                            : coachState.enabled 
                                ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-300' 
                                : 'bg-slate-200 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                    }`}>
                        <Mic className={`w-5 h-5 ${coachState.speaking ? 'animate-bounce' : ''}`} />
                        {coachState.speaking && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                🎙️ AI Audio Coach
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-pink-50 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30 font-bold">
                                {coachState.voiceType === 'coach_female' ? '🧘‍♀️ Coach Nữ Đào Chi' : '🏋️ HLV Nam Mạnh Mẽ'}
                            </span>
                        </div>

                        {/* Animated Equalizer Wave when Speaking */}
                        {coachState.speaking ? (
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Đang hướng dẫn</span>
                                <div className="flex items-center gap-0.5">
                                    <span className="w-1 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse" style={{ animationDuration: '300ms' }}></span>
                                    <span className="w-1 h-4.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse" style={{ animationDuration: '450ms' }}></span>
                                    <span className="w-1 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse" style={{ animationDuration: '350ms' }}></span>
                                    <span className="w-1 h-5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse" style={{ animationDuration: '500ms' }}></span>
                                    <span className="w-1 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse" style={{ animationDuration: '400ms' }}></span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                {coachState.enabled 
                                    ? 'Tự động đếm ngược giây nghỉ & hướng dẫn kỹ thuật form' 
                                    : 'Giọng nói đang tắt (nhấn Bật Voice để nghe HLV)'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right: Actions & Settings */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Quick Test Voice Button */}
                    <button
                        type="button"
                        onClick={handleTestVoice}
                        disabled={!coachState.enabled}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer disabled:opacity-40 shadow-2xs"
                        title="Nghe thử hướng dẫn của HLV"
                    >
                        <Play className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        <span>Thử giọng</span>
                    </button>

                    {/* Toggle Voice Audio Button */}
                    <button
                        type="button"
                        onClick={toggleVoice}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                            coachState.enabled
                                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-100 dark:hover:bg-emerald-500/30'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white shadow-2xs'
                        }`}
                        title={coachState.enabled ? 'Tắt giọng nói' : 'Bật giọng nói HLV'}
                    >
                        {coachState.enabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
                        <span>{coachState.enabled ? 'Voice: BẬT' : 'Voice: TẮT'}</span>
                    </button>

                    {/* Settings Trigger */}
                    <button
                        type="button"
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-xl border transition cursor-pointer ${
                            showSettings ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white shadow-2xs'
                        }`}
                        title="Cài đặt giọng HLV & Âm lượng"
                    >
                        <Sliders className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* EXPANDABLE SETTINGS TRAY */}
            {showSettings && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-fadeIn">
                    {/* Voice Selection */}
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 mb-1 block">Chọn Giọng HLV Ảo</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            <button
                                type="button"
                                onClick={() => handleVoiceChange('coach_female')}
                                className={`py-1.5 px-2 rounded-lg font-bold border text-center transition cursor-pointer text-xs ${
                                    coachState.voiceType === 'coach_female'
                                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-400 shadow-xs'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                            >
                                🧘‍♀️ Coach Đào Chi
                            </button>
                            <button
                                type="button"
                                onClick={() => handleVoiceChange('coach_male')}
                                className={`py-1.5 px-2 rounded-lg font-bold border text-center transition cursor-pointer text-xs ${
                                    coachState.voiceType === 'coach_male'
                                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                            >
                                🏋️ HLV Nam
                            </button>
                        </div>
                    </div>

                    {/* Volume Slider */}
                    <div>
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 mb-1">
                            <span>Âm lượng</span>
                            <span className="text-indigo-600 dark:text-indigo-300 font-mono font-bold">{Math.round(coachState.volume * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={coachState.volume}
                            onChange={(e) => audioCoach.setSettings({ volume: parseFloat(e.target.value) })}
                            className="w-full accent-indigo-500 mt-1 cursor-pointer"
                        />
                    </div>

                    {/* Sound FX Beep Toggle */}
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 mb-1 block">Tiếng Bíp Đếm Giây</label>
                        <button
                            type="button"
                            onClick={toggleSoundFx}
                            className={`w-full py-1.5 px-2 rounded-lg font-bold border transition cursor-pointer text-xs flex items-center justify-center gap-1.5 ${
                                coachState.soundFxEnabled
                                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                            }`}
                        >
                            <Bell className="w-3.5 h-3.5" />
                            <span>{coachState.soundFxEnabled ? '✓ Tiếng Bíp: BẬT' : '✕ Tiếng Bíp: TẮT'}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
