// src/components/MealTrackerModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { fetchDailyMeals, addMealLog, deleteMealLog, fetchFoodSuggestions, analyzeFoodImage } from '../services/api';
import { Camera, Upload, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

export default function MealTrackerModal({ isOpen, onClose, targetNutrition = {}, onMealsUpdated }) {
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [dailyData, setDailyData] = useState({ meals: {}, totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } });
    const [loading, setLoading] = useState(true);

    // Food Search & Add State
    const [activeMealType, setActiveMealType] = useState(null); // 'breakfast' | 'lunch' | 'dinner' | 'snack'
    const [foodSuggestions, setFoodSuggestions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [addMode, setAddMode] = useState('library'); // 'library' | 'ai_scan' | 'custom'

    // AI Food Scanner State
    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageMimeType, setImageMimeType] = useState('image/jpeg');
    const [aiHintText, setAiHintText] = useState('');
    const [analyzingImage, setAnalyzingImage] = useState(false);
    const [aiScanResult, setAiScanResult] = useState(null);

    // Custom Form State
    const [customFoodName, setCustomFoodName] = useState('');
    const [customCalories, setCustomCalories] = useState('');
    const [customProtein, setCustomProtein] = useState('');
    const [customCarbs, setCustomCarbs] = useState('');
    const [customFat, setCustomFat] = useState('');
    const [customServing, setCustomServing] = useState('1 phần');
    const [customNotes, setCustomNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState('');

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const targetCal = parseFloat(targetNutrition.targetCalories || targetNutrition.calories) || 2000;
    const targetPro = parseFloat(targetNutrition.protein) || 130;
    const targetCarb = parseFloat(targetNutrition.carbs || targetNutrition.carb) || 220;
    const targetF = parseFloat(targetNutrition.fat) || 60;

    const loadDailyData = async () => {
        setLoading(true);
        try {
            const res = await fetchDailyMeals(selectedDate);
            if (res.success) {
                setDailyData(res);
            }
        } catch (err) {
            console.error("Lỗi tải bữa ăn:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadSuggestions = async (query = '') => {
        try {
            const res = await fetchFoodSuggestions(query);
            if (res.success) {
                setFoodSuggestions(res.foods || []);
            }
        } catch (err) {
            console.error("Lỗi tìm món ăn:", err);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadDailyData();
            loadSuggestions('');
        }
    }, [isOpen, selectedDate]);

    if (!isOpen) return null;

    const resetScannerState = () => {
        setImagePreview(null);
        setAiHintText('');
        setAiScanResult(null);
        setAnalyzingImage(false);
    };

    const handleImageFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageMimeType(file.type || 'image/jpeg');
        const reader = new FileReader();
        reader.onload = (event) => {
            setImagePreview(event.target.result);
            setAiScanResult(null);
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyzeFoodImage = async () => {
        if (!imagePreview && !aiHintText.trim()) {
            alert('Vui lòng chọn ảnh bữa ăn hoặc nhập tên/mô tả món ăn để AI phân tích.');
            return;
        }
        setAnalyzingImage(true);
        try {
            const res = await analyzeFoodImage({
                imageBase64: imagePreview,
                mimeType: imageMimeType,
                hintText: aiHintText.trim()
            });

            if (res.success && res.analysis) {
                setAiScanResult(res.analysis);
                // Điền sẵn vào state để người dùng có thể chỉnh sửa trực tiếp nếu muốn
                setCustomFoodName(res.analysis.food_name || 'Món ăn quét AI');
                setCustomCalories(String(res.analysis.calories || 0));
                setCustomProtein(String(res.analysis.protein || 0));
                setCustomCarbs(String(res.analysis.carbs || 0));
                setCustomFat(String(res.analysis.fat || 0));
                setCustomServing(res.analysis.serving_size || '1 phần');
                setCustomNotes(res.analysis.health_tip || '');
            } else {
                alert(res.message || 'Không thể phân tích hình ảnh.');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi kết nối AI Vision Scanner.');
        } finally {
            setAnalyzingImage(false);
        }
    };

    const handleAddPresetFood = async (food) => {
        if (!activeMealType) return;
        setSubmitting(true);
        try {
            const res = await addMealLog({
                logDate: selectedDate,
                mealType: activeMealType,
                foodName: food.name,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fat: food.fat,
                servingSize: food.serving_size,
                notes: ''
            });

            if (res.success) {
                showToast(`✅ Đã thêm "${food.name}" vào bữa ăn!`);
                setActiveMealType(null);
                loadDailyData();
                if (onMealsUpdated) onMealsUpdated();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Không thể thêm món ăn.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddCustomFood = async (e) => {
        if (e) e.preventDefault();
        if (!customFoodName.trim()) {
            alert('Vui lòng nhập tên món ăn.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await addMealLog({
                logDate: selectedDate,
                mealType: activeMealType,
                foodName: customFoodName.trim(),
                calories: parseFloat(customCalories) || 0,
                protein: parseFloat(customProtein) || 0,
                carbs: parseFloat(customCarbs) || 0,
                fat: parseFloat(customFat) || 0,
                servingSize: customServing,
                notes: customNotes
            });

            if (res.success) {
                showToast(`✅ Đã thêm "${customFoodName}" thành công!`);
                setActiveMealType(null);
                setAddMode('library');
                resetScannerState();
                setCustomFoodName('');
                setCustomCalories('');
                setCustomProtein('');
                setCustomCarbs('');
                setCustomFat('');
                setCustomNotes('');
                loadDailyData();
                if (onMealsUpdated) onMealsUpdated();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Không thể thêm món ăn.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteFood = async (mealId, foodName) => {
        if (!window.confirm(`Bạn có chắc muốn xóa "${foodName}"?`)) return;
        try {
            const res = await deleteMealLog(mealId);
            if (res.success) {
                showToast('🗑️ Đã xóa món ăn khỏi nhật ký.');
                loadDailyData();
                if (onMealsUpdated) onMealsUpdated();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Không thể xóa món ăn.');
        }
    };

    const consumed = dailyData.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const remainingCal = Math.max(0, targetCal - consumed.calories);
    const calPercent = Math.min(100, Math.round((consumed.calories / targetCal) * 100));
    const proPercent = Math.min(100, Math.round((consumed.protein / targetPro) * 100));
    const carbPercent = Math.min(100, Math.round((consumed.carbs / targetCarb) * 100));
    const fatPercent = Math.min(100, Math.round((consumed.fat / targetF) * 100));

    const MEAL_CATEGORIES = [
        { type: 'breakfast', title: 'Bữa Sáng', icon: '🍳', defaultCalPercent: '25%' },
        { type: 'lunch', title: 'Bữa Trưa', icon: '🍱', defaultCalPercent: '35%' },
        { type: 'dinner', title: 'Bữa Tối', icon: '🥗', defaultCalPercent: '30%' },
        { type: 'snack', title: 'Bữa Phụ & Pre/Post Workout', icon: '🥛', defaultCalPercent: '10%' }
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-5xl xl:max-w-6xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 dark:border-slate-800 max-h-[94vh] overflow-y-auto space-y-7 transition-colors duration-300">

                {toast && (
                    <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl text-sm sm:text-base font-black animate-fadeIn flex items-center gap-2">
                        {toast}
                    </div>
                )}

                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl font-bold shadow-sm shrink-0">
                            🍽️
                        </div>
                        <div>
                            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                Nhật Ký Bữa Ăn &amp; AI Food Scanner
                            </h3>
                            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-0.5">
                                Quét ảnh món ăn bằng Gemini Vision AI hoặc tra cứu thư viện để kiểm soát Calo &amp; 3 chỉ số Macro.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2 rounded-2xl">
                            <span className="text-sm">📅</span>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent text-slate-900 dark:text-white text-sm sm:text-base font-bold focus:outline-none cursor-pointer"
                            />
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xl flex items-center justify-center transition cursor-pointer"
                            title="Đóng modal"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Macro Budget Overview Card */}
                <div className="bg-slate-50 dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-850/60 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                        
                        {/* Calorie Card */}
                        <div className="lg:col-span-4 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/70 p-5 rounded-2xl text-center flex flex-col justify-between items-center shadow-xs">
                            <span className="text-xs sm:text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                CALO ĐÃ NẠP
                            </span>
                            
                            <div className="my-2">
                                <span className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400">
                                    {Math.round(consumed.calories)}
                                </span>
                                <span className="text-base sm:text-lg text-slate-400 dark:text-slate-500 font-bold ml-1.5">
                                    / {targetCal} kcal
                                </span>
                            </div>

                            <div className="w-full space-y-2">
                                <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                                    <span>Tiến độ nạp calo</span>
                                    <span className={calPercent > 105 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}>
                                        {remainingCal > 0 ? `Còn lại: ${Math.round(remainingCal)} kcal` : `Đạt chỉ tiêu 🎉`}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            calPercent > 105 ? 'bg-red-500' : 'bg-emerald-500'
                                        }`}
                                        style={{ width: `${calPercent}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* 3 Macros Progress */}
                        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            
                            {/* Protein */}
                            <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/60 p-4 sm:p-5 rounded-2xl flex flex-col justify-between space-y-3 shadow-xs">
                                <div className="flex justify-between items-center">
                                    <span className="font-black text-base text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                        <span className="text-lg">🥩</span> Protein
                                    </span>
                                    <span className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-200">
                                        {Math.round(consumed.protein)}/{targetPro}g
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                        style={{ width: `${proPercent}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold">
                                    <span>Mục tiêu cơ nạc</span>
                                    <span className="text-blue-600 dark:text-blue-400">{proPercent}%</span>
                                </div>
                            </div>

                            {/* Carbs */}
                            <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/60 p-4 sm:p-5 rounded-2xl flex flex-col justify-between space-y-3 shadow-xs">
                                <div className="flex justify-between items-center">
                                    <span className="font-black text-base text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                        <span className="text-lg">🍚</span> Carbs
                                    </span>
                                    <span className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-200">
                                        {Math.round(consumed.carbs)}/{targetCarb}g
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                        style={{ width: `${carbPercent}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold">
                                    <span>Năng lượng vận động</span>
                                    <span className="text-amber-600 dark:text-amber-400">{carbPercent}%</span>
                                </div>
                            </div>

                            {/* Fat */}
                            <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/60 p-4 sm:p-5 rounded-2xl flex flex-col justify-between space-y-3 shadow-xs">
                                <div className="flex justify-between items-center">
                                    <span className="font-black text-base text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                        <span className="text-lg">🥑</span> Fat
                                    </span>
                                    <span className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-200">
                                        {Math.round(consumed.fat)}/{targetF}g
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-rose-500 rounded-full transition-all duration-500"
                                        style={{ width: `${fatPercent}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold">
                                    <span>Hormone &amp; Khớp</span>
                                    <span className="text-rose-600 dark:text-rose-400">{fatPercent}%</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* 4 Meal Lists */}
                {loading ? (
                    <div className="py-16 flex flex-col items-center justify-center space-y-3">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Đang đồng bộ thực đơn...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {MEAL_CATEGORIES.map(category => {
                            const mealItems = dailyData.meals?.[category.type] || [];
                            const categoryCal = mealItems.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
                            const categoryPro = mealItems.reduce((sum, item) => sum + (parseFloat(item.protein) || 0), 0);
                            const categoryCarb = mealItems.reduce((sum, item) => sum + (parseFloat(item.carbs) || 0), 0);
                            const categoryFat = mealItems.reduce((sum, item) => sum + (parseFloat(item.fat) || 0), 0);

                            return (
                                <div
                                    key={category.type}
                                    className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-2xl shadow-xs shrink-0">
                                                {category.icon}
                                            </div>
                                            <div>
                                                <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                    {category.title}
                                                </h4>
                                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                                    Đã nạp: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{Math.round(categoryCal)} kcal</strong> 
                                                    <span className="mx-1 text-slate-400">•</span> 
                                                    <span>{Math.round(categoryPro)}g P</span>
                                                    <span className="mx-1 text-slate-400">•</span>
                                                    <span>{Math.round(categoryCarb)}g C</span>
                                                    <span className="mx-1 text-slate-400">•</span>
                                                    <span>{Math.round(categoryFat)}g F</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 self-start sm:self-center">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveMealType(category.type);
                                                    setAddMode('ai_scan');
                                                    resetScannerState();
                                                }}
                                                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-black rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md hover:shadow-indigo-500/25 active:scale-95 shrink-0"
                                            >
                                                <Camera className="w-4 h-4" />
                                                <span>Quét ảnh AI</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveMealType(category.type);
                                                    setAddMode('library');
                                                    setSearchQuery('');
                                                    loadSuggestions('');
                                                }}
                                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md hover:shadow-emerald-500/25 active:scale-95 shrink-0"
                                            >
                                                <span className="text-base leading-none">+</span>
                                                <span>Thêm món</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    {mealItems.length > 0 ? (
                                        <div className="space-y-2.5 pt-1">
                                            {mealItems.map(item => (
                                                <div
                                                    key={item.id}
                                                    className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 flex justify-between items-center text-sm hover:border-slate-300 dark:hover:border-slate-600 transition shadow-xs gap-3"
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2.5">
                                                            <p className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                                                                {item.food_name}
                                                            </p>
                                                            {item.serving_size && (
                                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                                                    {item.serving_size}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                                                            <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm sm:text-base">
                                                                {Math.round(item.calories)} kcal
                                                            </span>
                                                            <span className="text-blue-600 dark:text-blue-400 font-bold">• Đạm: {item.protein}g</span>
                                                            <span className="text-amber-600 dark:text-amber-400 font-bold">• Carbs: {item.carbs}g</span>
                                                            <span className="text-rose-600 dark:text-rose-400 font-bold">• Béo: {item.fat}g</span>
                                                            {item.notes && <span className="italic text-slate-400">"{item.notes}"</span>}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleDeleteFood(item.id, item.food_name)}
                                                        className="text-slate-400 hover:text-red-500 p-2 text-lg font-bold cursor-pointer rounded-xl hover:bg-red-500/10 transition shrink-0"
                                                        title="Xóa món này"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm sm:text-base text-slate-400 dark:text-slate-500 italic py-2 pl-2">
                                            Chưa có món ăn nào được ghi nhận cho bữa này.
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* MODAL / DRAWER: ADD FOOD ITEM */}
                {activeMealType && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-60 animate-fadeIn">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-3xl lg:max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                            
                            {/* Modal Header */}
                            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
                                <div>
                                    <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="text-emerald-500">➕</span> Thêm Món Vào {MEAL_CATEGORIES.find(c => c.type === activeMealType)?.title}
                                    </h4>
                                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
                                        Quét ảnh món ăn bằng AI, chọn từ thư viện hoặc tự nhập khẩu phần
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveMealType(null)}
                                    className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xl flex items-center justify-center cursor-pointer transition"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* 3-Mode Toggle */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setAddMode('library')}
                                    className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
                                        addMode === 'library' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <span>🥗</span> Thư Viện Món Ăn
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAddMode('ai_scan')}
                                    className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
                                        addMode === 'ai_scan' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <Camera className="w-4 h-4" /> Quét Ảnh AI Vision
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAddMode('custom')}
                                    className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
                                        addMode === 'custom' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <span>✍️</span> Tự Nhập Tùy Chỉnh
                                </button>
                            </div>

                            {/* TAB 1: THƯ VIỆN MÓN ĂN */}
                            {addMode === 'library' && (
                                <div className="space-y-4">
                                    {/* Search input */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="🔍 Tìm kiếm món ăn (Bánh mì xíu mại, Rau muống luộc, Súp lơ luộc, Phở bò, Xôi gà, Cơm tấm...)"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                 setSearchQuery(e.target.value);
                                                 loadSuggestions(e.target.value);
                                            }}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm sm:text-base px-5 py-3.5 rounded-2xl focus:outline-none focus:border-emerald-500 shadow-inner"
                                        />
                                    </div>

                                    {/* Quick Category Filters */}
                                    <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                                        {[
                                            { label: 'Tất cả', val: '' },
                                            { label: '🥦 Rau Củ Luộc', val: 'Rau củ luộc & Hấp' },
                                            { label: '🥖 Bánh Mì', val: 'Bánh mì' },
                                            { label: '🍜 Món Nước', val: 'Món nước' },
                                            { label: '🍚 Xôi & Bánh', val: 'Xôi & Bánh' },
                                            { label: '🍱 Cơm & Món Chính', val: 'Cơm & Món chính' },
                                            { label: '☕ Đồ Uống', val: 'Đồ uống' },
                                            { label: '🥩 Fitness & Eat Clean', val: 'Fitness & Eat Clean' }
                                        ].map(cat => (
                                            <button
                                                key={cat.label}
                                                type="button"
                                                onClick={() => {
                                                    setSearchQuery(cat.val);
                                                    loadSuggestions(cat.val);
                                                }}
                                                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer border ${
                                                    searchQuery === cat.val
                                                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                                                        : 'bg-white dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Suggestions List */}
                                    <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
                                        {foodSuggestions.map((food, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 hover:border-emerald-500 dark:hover:border-emerald-500/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition shadow-xs"
                                            >
                                                <div className="space-y-2 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2.5">
                                                        <h5 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                                                            {food.name}
                                                        </h5>
                                                        {food.category && (
                                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                                                                {food.category}
                                                            </span>
                                                        )}
                                                        {food.serving_size && (
                                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                                                {food.serving_size}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {food.description && (
                                                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                                                            {food.description}
                                                        </p>
                                                    )}

                                                    <div className="flex flex-wrap items-center gap-3 pt-1">
                                                        <span className="text-base sm:text-lg text-emerald-600 dark:text-emerald-400 font-black bg-emerald-500/10 dark:bg-emerald-500/20 px-3 py-0.5 rounded-xl border border-emerald-500/20">
                                                            {Math.round(food.calories)} kcal
                                                        </span>
                                                        <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-extrabold">• Đạm: {food.protein}g</span>
                                                        <span className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-extrabold">• Carb: {food.carbs}g</span>
                                                        <span className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-extrabold">• Béo: {food.fat}g</span>
                                                    </div>
                                                </div>

                                                <button
                                                    disabled={submitting}
                                                    onClick={() => handleAddPresetFood(food)}
                                                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm sm:text-base font-black rounded-2xl transition cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-md hover:shadow-emerald-500/25 active:scale-95 shrink-0 self-end sm:self-center"
                                                >
                                                    + Chọn
                                                </button>
                                            </div>
                                        ))}

                                        {foodSuggestions.length === 0 && (
                                            <p className="text-sm sm:text-base text-slate-400 dark:text-slate-500 text-center py-8">
                                                Không tìm thấy món phù hợp. Hãy thử tab "Quét Ảnh AI Vision" hoặc "Tự Nhập Tùy Chỉnh".
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: QUÉT ẢNH MÓN ĂN BẰNG AI (GEMINI MULTIMODAL VISION) */}
                            {addMode === 'ai_scan' && (
                                <div className="space-y-5">
                                    {/* Khu vực tải ảnh / chụp ảnh */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                                        <div className="md:col-span-5 space-y-3">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={handleImageFileChange}
                                                className="hidden"
                                            />

                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-indigo-300 dark:border-indigo-700/70 hover:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-3xl p-4 min-h-[220px] flex flex-col items-center justify-center text-center cursor-pointer transition relative overflow-hidden group"
                                            >
                                                {imagePreview ? (
                                                    <div className="w-full h-full flex flex-col items-center">
                                                        <img
                                                            src={imagePreview}
                                                            alt="Food preview"
                                                            className="max-h-52 w-auto rounded-2xl object-cover shadow-md"
                                                        />
                                                        <span className="mt-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                                            <RefreshCw className="w-3.5 h-3.5" /> Nhấn để đổi bức ảnh khác
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2.5 p-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
                                                            <Upload className="w-7 h-7" />
                                                        </div>
                                                        <p className="font-black text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                                                            Chụp ảnh hoặc tải ảnh đĩa thức ăn lên
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            Hỗ trợ JPG, PNG, WEBP. AI sẽ nhận diện từng thành phần trong đĩa.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                                                    Tên món / Định lượng chi tiết (Giúp AI bóc tách chi tiết tới từng gram):
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="VD: 200g ức gà + 1 chén cơm gạo lứt + 2 quả trứng luộc, hoặc Cơm tấm sườn bì chả..."
                                                    value={aiHintText}
                                                    onChange={(e) => setAiHintText(e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
                                                />
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {[
                                                        'Cơm tấm sườn bì chả',
                                                        'Phở bò tái nạm',
                                                        '200g ức gà + 1 chén cơm gạo lứt + súp lơ',
                                                        'Bún bò Huế',
                                                        '150g cá hồi + 200g khoai lang + 2 quả trứng luộc',
                                                        'Bánh mì thịt chả pate'
                                                    ].map(sample => (
                                                        <button
                                                            key={sample}
                                                            type="button"
                                                            onClick={() => setAiHintText(sample)}
                                                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 hover:bg-indigo-100 transition cursor-pointer"
                                                        >
                                                            + {sample}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={analyzingImage}
                                                onClick={handleAnalyzeFoodImage}
                                                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95"
                                            >
                                                {analyzingImage ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        <span>AI Vision đang bóc tách Calo...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-5 h-5" />
                                                        <span>Phân Tích Dinh Dưỡng Bằng AI</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Kết quả phân tích từ AI */}
                                        <div className="md:col-span-7">
                                            {aiScanResult ? (
                                                <div className="bg-slate-50 dark:bg-slate-800/70 border border-indigo-200 dark:border-indigo-900/60 rounded-3xl p-5 space-y-4 animate-fadeIn">
                                                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                            <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                                                                Kết Quả Bóc Tách Từ AI Vision
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                                                            Độ tin cậy: {aiScanResult.confidence || 92}%
                                                        </span>
                                                    </div>

                                                    {/* Các thành phần phát hiện trên đĩa */}
                                                    {aiScanResult.items_detected?.length > 0 && (
                                                        <div className="space-y-1.5">
                                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                                Thành phần phát hiện trong khẩu phần:
                                                            </p>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {aiScanResult.items_detected.map((sub, i) => (
                                                                    <div key={i} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/70 text-xs flex justify-between items-center">
                                                                        <div>
                                                                            <p className="font-bold text-slate-800 dark:text-slate-200">{sub.name}</p>
                                                                            <p className="text-[11px] text-slate-400">~{sub.weight_g || 100}g • P:{sub.protein}g C:{sub.carbs}g F:{sub.fat}g</p>
                                                                        </div>
                                                                        <span className="font-black text-emerald-600 dark:text-emerald-400">{sub.calories} kcal</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Form xác nhận/hiệu chỉnh nhanh trước khi lưu */}
                                                    <div className="space-y-3 pt-1">
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                            <div className="sm:col-span-2">
                                                                <label className="block text-xs font-bold text-slate-500 mb-1">Tên món ăn</label>
                                                                <input
                                                                    type="text"
                                                                    value={customFoodName}
                                                                    onChange={(e) => setCustomFoodName(e.target.value)}
                                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-xl text-sm font-bold"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-500 mb-1">Định lượng</label>
                                                                <input
                                                                    type="text"
                                                                    value={customServing}
                                                                    onChange={(e) => setCustomServing(e.target.value)}
                                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-xl text-sm font-bold"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-4 gap-2">
                                                            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                                                                <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Calo (kcal)</label>
                                                                <input
                                                                    type="number"
                                                                    value={customCalories}
                                                                    onChange={(e) => setCustomCalories(e.target.value)}
                                                                    className="w-full bg-transparent font-black text-base text-emerald-700 dark:text-emerald-300 focus:outline-none"
                                                                />
                                                            </div>
                                                            <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800/50">
                                                                <label className="block text-[11px] font-bold text-blue-700 dark:text-blue-400">Đạm (g)</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.1"
                                                                    value={customProtein}
                                                                    onChange={(e) => setCustomProtein(e.target.value)}
                                                                    className="w-full bg-transparent font-black text-base text-blue-700 dark:text-blue-300 focus:outline-none"
                                                                />
                                                            </div>
                                                            <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/50">
                                                                <label className="block text-[11px] font-bold text-amber-700 dark:text-amber-400">Carbs (g)</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.1"
                                                                    value={customCarbs}
                                                                    onChange={(e) => setCustomCarbs(e.target.value)}
                                                                    className="w-full bg-transparent font-black text-base text-amber-700 dark:text-amber-300 focus:outline-none"
                                                                />
                                                            </div>
                                                            <div className="bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/50">
                                                                <label className="block text-[11px] font-bold text-rose-700 dark:text-rose-400">Fat (g)</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.1"
                                                                    value={customFat}
                                                                    onChange={(e) => setCustomFat(e.target.value)}
                                                                    className="w-full bg-transparent font-black text-base text-rose-700 dark:text-rose-300 focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        {aiScanResult.health_tip && (
                                                            <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/50 p-3 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
                                                                <span className="text-base">💡</span>
                                                                <span><strong>Nhận xét từ AI Coach:</strong> {aiScanResult.health_tip}</span>
                                                            </div>
                                                        )}

                                                        <button
                                                            type="button"
                                                            disabled={submitting}
                                                            onClick={handleAddCustomFood}
                                                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg transition cursor-pointer active:scale-95"
                                                        >
                                                            {submitting ? 'Đang lưu...' : '✅ Xác Nhận Lưu Vào Nhật Ký Bữa Ăn'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-full min-h-[260px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                                                    <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-3xl">
                                                        📸
                                                    </div>
                                                    <h5 className="font-black text-base sm:text-lg text-slate-800 dark:text-slate-200">
                                                        AI Smart Food Scanner
                                                    </h5>
                                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                                                        Tải lên hình ảnh mâm cơm, tô phở, hộp ức gà hoặc bất kỳ món ăn nào. AI sẽ tự động ước lượng khối lượng (gram), tổng Calo và tỷ lệ Đạm / Đường bột / Chất béo.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: TỰ NHẬP MÓN TÙY CHỈNH */}
                            {addMode === 'custom' && (
                                <form onSubmit={handleAddCustomFood} className="space-y-4 text-sm sm:text-base">
                                    <div>
                                        <label className="block text-slate-700 dark:text-slate-200 font-black mb-1.5">
                                            Tên món ăn / Thực phẩm *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ví dụ: Cơm sườn nướng mật ong"
                                            value={customFoodName}
                                            onChange={(e) => setCustomFoodName(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-emerald-500 font-bold"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-emerald-600 dark:text-emerald-400 font-black mb-1.5">Calo (kcal) *</label>
                                            <input
                                                type="number"
                                                step="1"
                                                required
                                                placeholder="350"
                                                value={customCalories}
                                                onChange={(e) => setCustomCalories(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-emerald-500 font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-blue-600 dark:text-blue-400 font-black mb-1.5">Protein (g)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                placeholder="25"
                                                value={customProtein}
                                                onChange={(e) => setCustomProtein(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-emerald-500 font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-amber-600 dark:text-amber-400 font-black mb-1.5">Carbs (g)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                placeholder="40"
                                                value={customCarbs}
                                                onChange={(e) => setCustomCarbs(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-emerald-500 font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-rose-600 dark:text-rose-400 font-black mb-1.5">Fat (g)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                placeholder="10"
                                                value={customFat}
                                                onChange={(e) => setCustomFat(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-emerald-500 font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-slate-700 dark:text-slate-200 font-black mb-1.5">Khẩu phần</label>
                                            <input
                                                type="text"
                                                placeholder="1 đĩa / 1 tô / 200g"
                                                value={customServing}
                                                onChange={(e) => setCustomServing(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-emerald-500 font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-700 dark:text-slate-200 font-black mb-1.5">Ghi chú</label>
                                            <input
                                                type="text"
                                                placeholder="Ít dầu mỡ, ăn kèm rau..."
                                                value={customNotes}
                                                onChange={(e) => setCustomNotes(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-emerald-500 font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-3 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setActiveMealType(null)}
                                            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold rounded-2xl transition cursor-pointer"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-7 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition cursor-pointer shadow-lg disabled:opacity-50 active:scale-95"
                                        >
                                            {submitting ? 'Đang lưu...' : 'Thêm Món Ăn 🥗'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
