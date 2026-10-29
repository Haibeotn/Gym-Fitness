// src/components/WorkoutStudioGenerator.jsx
import React, { useState } from 'react';
import { 
    Dumbbell, Sparkles, Plus, BookOpen, Filter, 
    Flame, CheckCircle2, RotateCcw, Volume2, ShieldCheck, 
    MapPin, Layers, Tag, ChevronDown, ChevronUp
} from 'lucide-react';
import { generateWorkout } from '../services/api';
import audioCoach from '../services/audioCoach';

export const MUSCLE_GROUPS = [
    { id: 'Chest', name: 'Ngực (Chest)', icon: '🛡️', color: 'rose', sub: 'Ngực trên, giữa, dưới' },
    { id: 'Back', name: 'Lưng & Xô (Back & Lats)', icon: '🦅', color: 'sky', sub: 'Độ rộng V-Taper & độ dày' },
    { id: 'Shoulders', name: 'Vai (Shoulders 3D)', icon: '🎯', color: 'amber', sub: 'Vai trước, vai giữa, vai sau' },
    { id: 'Biceps', name: 'Tay Trước (Biceps)', icon: '💪', color: 'indigo', sub: 'Đỉnh bắp tay & độ dày' },
    { id: 'Triceps', name: 'Tay Sau (Triceps)', icon: '⚡', color: 'violet', sub: 'Hình móng ngựa 3 đầu cơ' },
    { id: 'Quadriceps', name: 'Đùi Trước (Quads)', icon: '🦵', color: 'emerald', sub: 'Sức mạnh Squat & khối cơ' },
    { id: 'Hamstrings', name: 'Đùi Sau (Hamstrings)', icon: '🍗', color: 'teal', sub: 'Chuỗi cơ sau & uốn gối' },
    { id: 'Glutes', name: 'Mông (Glutes)', icon: '🍑', color: 'pink', sub: 'Nâng mông cao & săn chắc' },
    { id: 'Calves', name: 'Bắp Chân (Calves)', icon: '🦿', color: 'stone', sub: 'Gót chân & độ bền' },
    { id: 'Core', name: 'Bụng & Core (Abs)', icon: '🔥', color: 'orange', sub: 'Múi bụng 6 pack & liên sườn' },
    { id: 'Full Body', name: 'Toàn Thân & HIIT', icon: '⚡', color: 'yellow', sub: 'Đốt mỡ tối đa & tim mạch' }
];

export const EQUIPMENT_LIST = [
    { id: 'Full Gym', name: 'Phòng Gym Đầy Đủ Thiết Bị', icon: '🏢', isUniversal: true },
    { id: 'Bodyweight', name: 'Trọng Lượng Cơ Thể (Bodyweight)', icon: '🤸‍♂️' },
    { id: 'Dumbbell', name: 'Tạ Đơn (Dumbbells)', icon: '🏋️' },
    { id: 'Barbell', name: 'Tạ Đòn & Bánh Tạ (Barbell)', icon: '🏋️‍♂️' },
    { id: 'Cable Machine', name: 'Dàn Kéo Cáp (Cable)', icon: '🏗️' },
    { id: 'Resistance Bands', name: 'Dây Kháng Lực (Bands)', icon: '⚡' },
    { id: 'Pull-Up Bar', name: 'Xà Đơn & Xà Kép', icon: '🪜' },
    { id: 'Flat Bench', name: 'Ghế Tập Phẳng / Dốc', icon: '🛋️' },
    { id: 'Leg Press Machine', name: 'Máy Khối (Leg Press / Pec Fly)', icon: '🏢' },
    { id: 'Yoga Mat', name: 'Thảm Tập & Sàn', icon: '🧘' }
];

export const ENVIRONMENTS = [
    { id: 'all', name: 'Tất Cả Không Gian', icon: '✨' },
    { id: 'gym', name: 'Phòng Gym Chuyên Nghiệp', icon: '🏢' },
    { id: 'home', name: 'Tại Nhà (Home Workout)', icon: '🏠' },
    { id: 'calisthenics', name: 'Công Viên / Calisthenics', icon: '🌳' }
];

export const getMuscleTagStyle = (muscleName = '') => {
    const lower = muscleName.toLowerCase();
    if (lower.includes('chest') || lower.includes('ngực')) return 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 ring-rose-500/20';
    if (lower.includes('back') || lower.includes('lats') || lower.includes('xô') || lower.includes('lưng')) return 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 ring-sky-500/20';
    if (lower.includes('shoulder') || lower.includes('vai')) return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 ring-amber-500/20';
    if (lower.includes('bicep') || lower.includes('tricep') || lower.includes('tay') || lower.includes('arm')) return 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 ring-indigo-500/20';
    if (lower.includes('quad') || lower.includes('hamstring') || lower.includes('chân') || lower.includes('đùi')) return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 ring-emerald-500/20';
    if (lower.includes('glute') || lower.includes('mông')) return 'bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800 ring-pink-500/20';
    if (lower.includes('core') || lower.includes('abs') || lower.includes('bụng')) return 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 ring-orange-500/20';
    return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 ring-purple-500/20';
};

export default function WorkoutStudioGenerator({ 
    userInjuries = [], 
    onWorkoutGenerated, 
    onOpenLibrary,
    onAddCustomExercise 
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedMuscles, setSelectedMuscles] = useState(['Chest', 'Triceps']);
    const [selectedEquipment, setSelectedEquipment] = useState(['Full Gym', 'Dumbbell', 'Barbell']);
    const [selectedEnvironment, setSelectedEnvironment] = useState('gym');
    const [generating, setGenerating] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [useGeminiAi, setUseGeminiAi] = useState(false);

    // Toggle muscle selection
    const toggleMuscle = (muscleId) => {
        if (selectedMuscles.includes(muscleId)) {
            if (selectedMuscles.length > 1) {
                setSelectedMuscles(selectedMuscles.filter(m => m !== muscleId));
            }
        } else {
            setSelectedMuscles([...selectedMuscles, muscleId]);
        }
    };

    // Toggle equipment selection
    const toggleEquipment = (eqId) => {
        if (eqId === 'Full Gym') {
            setSelectedEquipment(['Full Gym', 'Dumbbell', 'Barbell', 'Cable Machine', 'Flat Bench']);
            return;
        }

        let updated = selectedEquipment.filter(e => e !== 'Full Gym');
        if (updated.includes(eqId)) {
            if (updated.length > 1) {
                updated = updated.filter(e => e !== eqId);
            }
        } else {
            updated.push(eqId);
        }
        setSelectedEquipment(updated);
    };

    // Select preset routines
    const handleQuickPreset = (type) => {
        if (type === 'push') {
            setSelectedMuscles(['Chest', 'Shoulders', 'Triceps']);
        } else if (type === 'pull') {
            setSelectedMuscles(['Back', 'Lats', 'Biceps']);
        } else if (type === 'legs') {
            setSelectedMuscles(['Quadriceps', 'Hamstrings', 'Glutes', 'Calves']);
        } else if (type === 'home') {
            setSelectedMuscles(['Chest', 'Back', 'Core', 'Full Body']);
            setSelectedEquipment(['Bodyweight', 'Dumbbell', 'Resistance Bands', 'Yoga Mat']);
            setSelectedEnvironment('home');
        } else if (type === 'calisthenics') {
            setSelectedMuscles(['Chest', 'Back', 'Shoulders', 'Core']);
            setSelectedEquipment(['Bodyweight', 'Pull-Up Bar']);
            setSelectedEnvironment('calisthenics');
        }
    };

    // Handle AI generation
    const handleGenerate = async () => {
        setGenerating(true);
        setFeedbackMsg('');
        try {
            const payload = {
                targetMuscles: selectedMuscles,
                availableEquipment: selectedEquipment,
                environment: selectedEnvironment,
                userInjuries: userInjuries,
                shouldSaveToPlan: true,
                mode: useGeminiAi ? 'ai' : 'smart',
                useAi: useGeminiAi
            };

            const res = await generateWorkout(payload);
            if (res?.data && res.data.length > 0) {
                setFeedbackMsg(`🎉 Đã tạo thành công ${res.data.length} bài tập tối ưu hóa!`);
                if (onWorkoutGenerated) {
                    onWorkoutGenerated(res.data, res.ai_coach_advice);
                }
            } else {
                setFeedbackMsg("⚠️ Không tìm thấy bài tập phù hợp với điều kiện lọc.");
            }
        } catch (err) {
            setFeedbackMsg("⚠️ Lỗi tạo bài tập: " + (err.response?.data?.message || err.message));
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition space-y-6">
            
            {/* Header & Toggle Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center text-2xl font-black shadow-md shadow-blue-500/20 shrink-0">
                        ⚡
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                                AI Workout Studio &amp; Bộ Tùy Biến Bài Tập
                            </h3>
                            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-cyan-500/20 text-blue-700 dark:text-cyan-300 uppercase tracking-wider border border-blue-200 dark:border-cyan-500/30">
                                Gym / Home / Calisthenics
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                            Chọn nhóm cơ muốn tập + dụng cụ hiện có để AI sinh ngay lộ trình hoặc tra cứu thư viện 55+ bài tập
                        </p>
                    </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                    <button
                        type="button"
                        onClick={onOpenLibrary}
                        className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-xs border border-transparent dark:border-slate-700"
                    >
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        <span>Thư Viện 55+ Bài</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="px-4 py-2.5 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-slate-700 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                        <span>{isExpanded ? 'Thu Gọn Bộ Lọc' : 'Tùy Chỉnh Nhóm Cơ & Dụng Cụ'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Quick Preset Buttons Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm">
                <span className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase shrink-0">Lộ trình mẫu:</span>
                <button
                    type="button"
                    onClick={() => handleQuickPreset('push')}
                    className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-300 font-bold text-gray-700 dark:text-slate-300 transition cursor-pointer whitespace-nowrap text-xs sm:text-sm"
                >
                    🛡️ Buổi Đẩy (Ngực / Vai / Tay sau)
                </button>
                <button
                    type="button"
                    onClick={() => handleQuickPreset('pull')}
                    className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-700 dark:hover:text-sky-300 font-bold text-gray-700 dark:text-slate-300 transition cursor-pointer whitespace-nowrap text-xs sm:text-sm"
                >
                    🦅 Buổi Kéo (Lưng / Xô / Tay trước)
                </button>
                <button
                    type="button"
                    onClick={() => handleQuickPreset('legs')}
                    className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold text-gray-700 dark:text-slate-300 transition cursor-pointer whitespace-nowrap text-xs sm:text-sm"
                >
                    🦵 Buổi Chân &amp; Mông (Legs &amp; Glutes)
                </button>
                <button
                    type="button"
                    onClick={() => handleQuickPreset('home')}
                    className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-700 dark:hover:text-amber-300 font-bold text-gray-700 dark:text-slate-300 transition cursor-pointer whitespace-nowrap text-xs sm:text-sm"
                >
                    🏠 Tại Nhà Không Cần Tạ Nặng
                </button>
                <button
                    type="button"
                    onClick={() => handleQuickPreset('calisthenics')}
                    className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-700 dark:hover:text-purple-300 font-bold text-gray-700 dark:text-slate-300 transition cursor-pointer whitespace-nowrap text-xs sm:text-sm"
                >
                    🌳 Calisthenics Xà Đơn / Xà Kép
                </button>
            </div>

            {/* Expanded Multi-Select Studio Panel */}
            {isExpanded && (
                <div className="space-y-6 pt-5 border-t border-gray-100 dark:border-slate-800 animate-in fade-in duration-200">
                    
                    {/* 1. Môi Trường Tập Luyện */}
                    <div className="space-y-2.5">
                        <label className="text-xs sm:text-sm font-black text-gray-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                            1. Môi Trường &amp; Không Gian Luyện Tập:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {ENVIRONMENTS.map(env => (
                                <button
                                    key={env.id}
                                    type="button"
                                    onClick={() => setSelectedEnvironment(env.id)}
                                    className={`p-3.5 sm:p-4 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                                        selectedEnvironment === env.id
                                            ? 'bg-blue-600 dark:bg-cyan-600 text-white border-blue-600 dark:border-cyan-600 shadow-sm shadow-blue-500/20'
                                            : 'bg-gray-50 dark:bg-slate-950 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <span className="text-2xl">{env.icon}</span>
                                    <span className="text-xs sm:text-sm font-bold leading-tight">{env.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Nhóm Cơ Mục Tiêu (Multi-Select Cards) */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs sm:text-sm font-black text-gray-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                                2. Chọn Nhóm Cơ Muốn Tập Hôm Nay ({selectedMuscles.length} nhóm cơ đã chọn):
                            </label>
                            <button
                                type="button"
                                onClick={() => setSelectedMuscles(MUSCLE_GROUPS.map(m => m.id))}
                                className="text-xs sm:text-sm font-bold text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
                            >
                                Chọn Tất Cả (Full Body)
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {MUSCLE_GROUPS.map(muscle => {
                                const isSelected = selectedMuscles.includes(muscle.id);
                                return (
                                    <div
                                        key={muscle.id}
                                        onClick={() => toggleMuscle(muscle.id)}
                                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                                            isSelected
                                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/70 dark:to-indigo-950/70 border-blue-500 dark:border-cyan-500 ring-2 ring-blue-400 dark:ring-cyan-500 shadow-xs'
                                                : 'bg-gray-50/70 dark:bg-slate-950/70 border-gray-200 dark:border-slate-800 hover:bg-gray-100/80 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <span className="text-3xl shrink-0">{muscle.icon}</span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className={`text-xs sm:text-sm font-black truncate ${isSelected ? 'text-blue-950 dark:text-cyan-300' : 'text-gray-800 dark:text-slate-200'}`}>
                                                    {muscle.name}
                                                </p>
                                                {isSelected && <span className="text-xs sm:text-sm text-blue-600 dark:text-cyan-400 font-bold">✓</span>}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">{muscle.sub}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. Dụng Cụ Hiện Có (Selectable Equipment Tags) */}
                    <div className="space-y-2.5">
                        <label className="text-xs sm:text-sm font-black text-gray-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <Dumbbell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            3. Thẻ Dụng Cụ Hiện Có (Nhấp để bật/tắt):
                        </label>
                        
                        <div className="flex flex-wrap gap-2.5">
                            {EQUIPMENT_LIST.map(eq => {
                                const isSelected = selectedEquipment.includes(eq.id);
                                return (
                                    <button
                                        key={eq.id}
                                        type="button"
                                        onClick={() => toggleEquipment(eq.id)}
                                        className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer border ${
                                            isSelected
                                                ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 border-slate-900 dark:border-cyan-500 shadow-xs'
                                                : 'bg-gray-50 dark:bg-slate-950 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <span className="text-base">{eq.icon}</span>
                                        <span>{eq.name}</span>
                                        {isSelected && <span className="text-cyan-400 dark:text-slate-950 text-xs font-black">✓</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Action Execution Bar */}
                    <div className="pt-2 flex flex-col lg:flex-row items-center justify-between gap-4 bg-blue-50/50 dark:bg-slate-950/80 p-5 rounded-2xl border border-blue-100 dark:border-slate-800">
                        <div className="text-xs sm:text-sm text-blue-950 dark:text-slate-200 font-medium leading-relaxed">
                            <div>
                                <span>Sẵn sàng tạo giáo án: </span>
                                <strong className="text-blue-700 dark:text-cyan-400">{selectedMuscles.join(', ')}</strong> 
                                <span> với dụng cụ: </span>
                                <strong className="text-gray-800 dark:text-white">{selectedEquipment.slice(0, 3).join(', ')}{selectedEquipment.length > 3 ? '...' : ''}</strong>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                🔒 Tự động áp dụng giới hạn tối đa 4 - 6 bài &amp; cấu trúc 4 pha bảo vệ hệ thần kinh trung ương (CNS).
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                            {/* Mode Toggle */}
                            <div className="flex items-center bg-gray-200/70 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => setUseGeminiAi(false)}
                                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                                        !useGeminiAi 
                                            ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-cyan-300 shadow-xs' 
                                            : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
                                    }`}
                                >
                                    ⚡ Thuật Toán 4 Pha
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUseGeminiAi(true)}
                                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                                        useGeminiAi 
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs' 
                                            : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
                                    }`}
                                >
                                    🤖 Gemini AI
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={handleGenerate}
                                disabled={generating}
                                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                            >
                                {generating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>{useGeminiAi ? 'Gemini AI Đang Soạn Giáo Án...' : 'Đang Lọc & Thiết Kế 4 Pha...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 text-cyan-300" />
                                        <span>{useGeminiAi ? '🤖 Tạo Giáo Án' : '⚡ Sinh Lộ Trình 4 Pha'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {feedbackMsg && (
                        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                            <span>✨</span>
                            <span>{feedbackMsg}</span>
                        </div>
                    )}

                </div>
            )}

        </div>
    );
}
