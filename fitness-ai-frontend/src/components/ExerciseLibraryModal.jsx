// src/components/ExerciseLibraryModal.jsx
import React, { useState, useEffect } from 'react';
import { 
    Search, Dumbbell, Filter, Plus, Check, Volume2, 
    X, Sparkles, AlertCircle, Layers, ShieldCheck 
} from 'lucide-react';
import { fetchExerciseLibrary } from '../services/api';
import audioCoach from '../services/audioCoach';

export default function ExerciseLibraryModal({ isOpen, onClose, onAddExercise }) {
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMuscle, setSelectedMuscle] = useState('all');
    const [selectedEquipment, setSelectedEquipment] = useState('all');
    const [selectedMechanic, setSelectedMechanic] = useState('all');
    const [addedIds, setAddedIds] = useState([]);

    const muscleOptions = [
        { id: 'all', label: 'Tất cả nhóm cơ' },
        { id: 'Chest', label: '🛡️ Ngực (Chest)' },
        { id: 'Back', label: '🦅 Lưng & Xô (Back)' },
        { id: 'Lats', label: '📐 Xô (Lats)' },
        { id: 'Shoulders', label: '🎯 Vai (Shoulders)' },
        { id: 'Biceps', label: '💪 Tay trước (Biceps)' },
        { id: 'Triceps', label: '⚡ Tay sau (Triceps)' },
        { id: 'Quadriceps', label: '🦵 Đùi trước (Quads)' },
        { id: 'Hamstrings', label: '🍗 Đùi sau (Hamstrings)' },
        { id: 'Glutes', label: '🍑 Mông (Glutes)' },
        { id: 'Calves', label: '🦿 Bắp chân (Calves)' },
        { id: 'Core', label: '🔥 Bụng & Core' },
        { id: 'Full Body', label: '⚡ Toàn thân / HIIT' }
    ];

    const equipmentOptions = [
        { id: 'all', label: 'Tất cả dụng cụ' },
        { id: 'Bodyweight', label: '🤸‍♂️ Bodyweight (Không tạ)' },
        { id: 'Dumbbell', label: '🏋️ Tạ đơn (Dumbbell)' },
        { id: 'Barbell', label: '🏋️‍♂️ Tạ đòn (Barbell)' },
        { id: 'Cable Machine', label: '🏗️ Dàn kéo cáp' },
        { id: 'Resistance Bands', label: '⚡ Dây kháng lực' },
        { id: 'Pull-Up Bar', label: '🪜 Xà đơn / Xà kép' },
        { id: 'Flat Bench', label: '🛋️ Ghế tập (Bench)' }
    ];

    useEffect(() => {
        if (isOpen) {
            loadExercises();
        }
    }, [isOpen, selectedMuscle, selectedEquipment, selectedMechanic]);

    const loadExercises = async () => {
        setLoading(true);
        try {
            const params = {};
            if (selectedMuscle !== 'all') params.muscle = selectedMuscle;
            if (selectedEquipment !== 'all') params.equipment = selectedEquipment;
            if (selectedMechanic !== 'all') params.mechanic = selectedMechanic;
            if (searchQuery.trim()) params.search = searchQuery.trim();

            const res = await fetchExerciseLibrary(params);
            if (res?.exercises) {
                setExercises(res.exercises);
            }
        } catch (err) {
            console.error("Lỗi tải thư viện bài tập:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        loadExercises();
    };

    const handleSelectExercise = (exercise) => {
        if (onAddExercise) {
            onAddExercise(exercise);
            setAddedIds(prev => [...prev, exercise.id]);
            setTimeout(() => {
                setAddedIds(prev => prev.filter(id => id !== exercise.id));
            }, 2500);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl xl:max-w-6xl w-full h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-300">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-100/90 dark:bg-slate-950/70">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shrink-0">
                            📖
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                                Thư Viện Bài Tập
                                <span className="text-xs sm:text-sm px-3 py-1 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-mono font-bold border border-cyan-500/20">
                                    {exercises.length} Bài tập
                                </span>
                            </h2>
                            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-0.5">
                                Tra cứu form, phân loại nhóm cơ tác động và thêm trực tiếp vào giáo án
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 space-y-4">
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên bài tập, hướng dẫn, tag..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 pl-12 pr-28 py-3.5 rounded-2xl text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner font-medium"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm rounded-xl transition cursor-pointer active:scale-95 shadow-xs"
                        >
                            Tìm kiếm
                        </button>
                    </form>

                    {/* Filter Dropdowns */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs sm:text-sm font-black text-slate-600 dark:text-slate-400 block mb-1.5">
                                Nhóm Cơ
                            </label>
                            <select
                                value={selectedMuscle}
                                onChange={(e) => setSelectedMuscle(e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 p-3 rounded-2xl text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                            >
                                {muscleOptions.map(m => (
                                    <option key={m.id} value={m.id}>{m.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs sm:text-sm font-black text-slate-600 dark:text-slate-400 block mb-1.5">
                                Dụng Cụ
                            </label>
                            <select
                                value={selectedEquipment}
                                onChange={(e) => setSelectedEquipment(e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 p-3 rounded-2xl text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                            >
                                {equipmentOptions.map(eq => (
                                    <option key={eq.id} value={eq.id}>{eq.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs sm:text-sm font-black text-slate-600 dark:text-slate-400 block mb-1.5">
                                Cơ Học (Mechanic)
                            </label>
                            <select
                                value={selectedMechanic}
                                onChange={(e) => setSelectedMechanic(e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 p-3 rounded-2xl text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                            >
                                <option value="all">Tất cả kiểu chuyển động</option>
                                <option value="Compound">Compound (Phức hợp đa khớp)</option>
                                <option value="Isolation">Isolation (Cô lập 1 nhóm cơ)</option>
                                <option value="Isometric">Isometric (Tĩnh gồng cơ)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Exercises Scrollable List */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 custom-scrollbar bg-slate-50/40 dark:bg-transparent">
                    {loading ? (
                        <div className="py-24 text-center space-y-3">
                            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Đang tra cứu kho bài tập...</p>
                        </div>
                    ) : exercises.length === 0 ? (
                        <div className="py-24 text-center text-slate-400 dark:text-slate-500 space-y-3">
                            <AlertCircle className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
                            <p className="text-base font-bold">Không tìm thấy bài tập nào phù hợp với bộ lọc.</p>
                            <button
                                onClick={() => {
                                    setSelectedMuscle('all');
                                    setSelectedEquipment('all');
                                    setSelectedMechanic('all');
                                    setSearchQuery('');
                                }}
                                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-cyan-600 dark:text-cyan-400 text-sm font-bold rounded-2xl transition cursor-pointer"
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    ) : (
                        exercises.map((ex) => {
                            const isAdded = addedIds.includes(ex.id);
                            return (
                                <div 
                                    key={ex.id}
                                    className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 rounded-3xl p-5 sm:p-6 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xs"
                                >
                                    <div className="space-y-2.5 flex-1">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <h4 className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
                                                {ex.name}
                                            </h4>
                                            
                                            {/* Primary Muscle Badge */}
                                            <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                                                {ex.primary_muscle}
                                            </span>

                                            {/* Mechanic Badge */}
                                            <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                {ex.mechanic || 'Compound'}
                                            </span>

                                            {/* Target Sets & Reps */}
                                            <span className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-mono bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 font-bold">
                                                {ex.target_sets || 3} hiệp x {ex.target_reps || '10-12'} rep {ex.target_rpe ? `(RPE ${ex.target_rpe})` : ''}
                                            </span>
                                        </div>

                                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                                            {ex.instructions || ex.description || 'Thực hiện động tác chuẩn form, kiểm soát nhịp thở.'}
                                        </p>

                                        {/* Tags & Equipment */}
                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                            {ex.equipment_required && ex.equipment_required.length > 0 ? (
                                                ex.equipment_required.map((eq, idx) => (
                                                    <span key={idx} className="text-xs sm:text-sm font-medium px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                                                        🛠️ {eq}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs sm:text-sm font-medium px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                                    🤸‍♂️ Bodyweight (Không cần dụng cụ)
                                                </span>
                                            )}

                                            {ex.secondary_muscles && ex.secondary_muscles.length > 0 && (
                                                <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                                                    • Cơ phụ: {ex.secondary_muscles.join(', ')}
                                                </span>
                                            )}

                                            {ex.tags && Array.isArray(ex.tags) && ex.tags.slice(0, 4).map((tag, tIdx) => (
                                                <span key={tIdx} className="text-xs font-mono text-cyan-600 dark:text-cyan-400/80 font-semibold">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex sm:flex-col items-center sm:items-end gap-2.5 shrink-0 self-end sm:self-center">
                                        <button
                                            type="button"
                                            onClick={() => audioCoach.speakExerciseForm(ex.name)}
                                            className="px-4 py-2.5 bg-indigo-500/10 dark:bg-indigo-600/20 hover:bg-indigo-500/20 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-extrabold rounded-2xl border border-indigo-500/30 transition cursor-pointer flex items-center gap-1.5"
                                            title="Nghe giọng nói AI đọc form"
                                        >
                                            <Volume2 className="w-4 h-4" />
                                            <span>Nghe Form</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleSelectExercise(ex)}
                                            disabled={isAdded}
                                            className={`px-5 py-2.5 text-sm sm:text-base font-black rounded-2xl transition cursor-pointer flex items-center gap-2 shadow-md ${
                                                isAdded 
                                                    ? 'bg-emerald-600 text-white cursor-default'
                                                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 active:scale-95'
                                            }`}
                                        >
                                            {isAdded ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    <span>Đã Thêm ✓</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-4 h-4" />
                                                    <span>Thêm Bài Này</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <span className="text-center sm:text-left">
                        💡 Tip: Bấm <strong>"Thêm Bài Này"</strong> để gắn trực tiếp vào danh sách tập của bạn trên Dashboard.
                    </span>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm sm:text-base rounded-2xl transition cursor-pointer shrink-0"
                    >
                        Đóng Thư Viện
                    </button>
                </div>

            </div>
        </div>
    );
}
