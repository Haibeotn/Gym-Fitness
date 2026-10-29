import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { addMealLog } from '../../services/api';
import {
  Camera,
  X,
  Flame,
  Sparkles,
  Check,
  Plus,
  RefreshCw,
  ShieldAlert,
  Utensils,
  Activity,
  Scale,
  UploadCloud,
} from 'lucide-react';

function getLocalTodayKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Bữa Sáng', icon: '🌅' },
  { id: 'lunch', label: 'Bữa Trưa', icon: '☀️' },
  { id: 'dinner', label: 'Bữa Tối', icon: '🌙' },
  { id: 'snack', label: 'Bữa Phụ', icon: '🍎' },
];

export default function AiFoodStudioModal({
  isOpen,
  onClose,
  targetCalories = 2200,
  currentCalories = 0,
  onMealAdded,
}) {
  const [preview, setPreview] = useState(null);
  const [userHint, setUserHint] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [refusalMsg, setRefusalMsg] = useState('');
  const [isUnrelated, setIsUnrelated] = useState(false);
  const [mealType, setMealType] = useState('lunch');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const analyzeImageBase64 = async (base64Data, hintText = userHint) => {
    setScanning(true);
    setRefusalMsg('');
    setScanResult(null);
    setSavedSuccess(false);

    try {
      const res = await fetch('http://localhost:3000/api/meals/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          dishHint: hintText,
          note: hintText,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setIsUnrelated(Boolean(json.isUnrelated));
        setRefusalMsg(
          json.message ||
            'Hình ảnh không thuộc danh mục đồ ăn nên Coach xin phép không tính Calo nhé!'
        );
      } else {
        setIsUnrelated(false);
        setScanResult(json.data);
      }
    } catch (_) {
      setIsUnrelated(false);
      setRefusalMsg('Không thể kết nối tới máy chủ phân tích bữa ăn. Hãy kiểm tra lại Backend.');
    } finally {
      setScanning(false);
    }
  };

  const handleSelectPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      analyzeImageBase64(reader.result, userHint);
    };
    reader.readAsDataURL(file);
  };

  const handleAddToDailyStats = async () => {
    if (!scanResult) return;
    setSaving(true);
    const addedMeal = {
      meal_type: mealType,
      meal_name: scanResult.food_name || scanResult.dish_name || 'Bữa ăn AI',
      food_name: scanResult.food_name || scanResult.dish_name || 'Bữa ăn AI',
      calories: Number(scanResult.calories) || 0,
      protein: Number(scanResult.protein) || 0,
      carbs: Number(scanResult.carbs) || 0,
      fat: Number(scanResult.fat) || 0,
      portion_grams: Number(scanResult.portion_grams) || scanResult.estimated_weight_g || 350,
      log_date: getLocalTodayKey(),
      notes: scanResult.advice || scanResult.notes || 'Quét từ AI Food Vision Studio',
    };

    try {
      if (localStorage.getItem('fitness_token')) {
        await addMealLog({
          logDate: addedMeal.log_date,
          mealType: addedMeal.meal_type,
          foodName: addedMeal.food_name,
          calories: addedMeal.calories,
          protein: addedMeal.protein,
          carbs: addedMeal.carbs,
          fat: addedMeal.fat,
          servingSize: `${addedMeal.portion_grams}g`,
          notes: addedMeal.notes,
        });
      }
    } catch (err) {
      console.warn('Lỗi lưu bữa ăn vào Database:', err);
    }

    setSaving(false);
    setSavedSuccess(true);
    if (typeof onMealAdded === 'function') {
      onMealAdded(addedMeal);
    }
    setTimeout(() => {
      onClose();
    }, 700);
  };

  const projectedCalories =
    Number(currentCalories || 0) + Number(scanResult?.calories || 0);
  const currentPercent = Math.min(
    100,
    Math.round(((currentCalories || 0) / (targetCalories || 2200)) * 100)
  );
  const projectedPercent = Math.min(
    100,
    Math.round((projectedCalories / (targetCalories || 2200)) * 100)
  );

  const modalUI = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] rounded-3xl bg-slate-950 border-2 border-orange-500/40 shadow-2xl shadow-orange-500/10 flex flex-col overflow-hidden text-white"
      >
        {/* STUDIO HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
              <Camera className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black italic uppercase tracking-tight text-white">
                  AI Vision Nutrition Studio
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Nhận diện khẩu phần (gram) • Tính toán Calo & Macro tự động
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STUDIO BODY (BỐ CỤC 2 CỘT RỘNG RÃI) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CỘT TRÁI (5/12): KHUNG NGẮM CAMERA 3D & TẢI ẢNH */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleSelectPhoto}
              className="hidden"
            />

            {!preview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer group flex-1 min-h-[280px] rounded-2xl border-2 border-dashed border-orange-500/40 hover:border-orange-400 bg-slate-900/60 hover:bg-slate-900/90 p-6 flex flex-col items-center justify-center text-center transition-all relative overflow-hidden"
              >
                <div className="w-16 h-16 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-base font-black uppercase italic text-white mb-1">
                  Bấm để chọn ảnh bữa ăn
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mb-4">
                  Hỗ trợ ảnh chụp Cơm, Phở, Bún, Ức gà, Trái cây... AI sẽ tự động bóc tách khối lượng (gram) và tính Macro.
                </p>
                <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase italic shadow-lg shadow-orange-500/25">
                  📷 Mở Máy Ảnh / Thư Viện
                </span>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border-2 border-orange-500/50 bg-slate-900 aspect-[4/3] shadow-xl">
                <img
                  src={preview}
                  alt="Food scan preview"
                  className="w-full h-full object-cover"
                />
                {/* 4 góc ngắm HUD Thể thao */}
                <span className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-orange-400" />
                <span className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-orange-400" />
                <span className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-orange-400" />
                <span className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-orange-400" />

                {scanning && <div className="ai-scanline" />}

                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                  <span className="text-[11px] font-bold text-orange-300 truncate">
                    {scanning ? '🔍 Đang quét Laser 3D...' : '✅ Đã quét xong khẩu phần'}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500 text-slate-950 font-black text-[11px] uppercase cursor-pointer hover:bg-orange-400"
                  >
                    <RefreshCw className="w-3 h-3" /> Đổi ảnh
                  </button>
                </div>
              </div>
            )}

            {/* Ô GHI CHÚ KHẨU PHẦN TÙY CHỌN */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                💡 Ghi chú thêm cho AI (Tuỳ chọn):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userHint}
                  onChange={(e) => setUserHint(e.target.value)}
                  placeholder="VD: Thêm 150g ức gà, 80g kimchi, ít cơm, không trứng... (Nhấn Enter)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && preview && !scanning) {
                      e.preventDefault();
                      analyzeImageBase64(preview, userHint);
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-orange-400 text-xs text-white placeholder-slate-500 outline-none"
                />
                {preview && (
                  <button
                    type="button"
                    disabled={scanning}
                    onClick={() => analyzeImageBase64(preview, userHint)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-300 font-bold text-xs whitespace-nowrap cursor-pointer"
                  >
                    Phân tích lại
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (7/12): BÁO CÁO DINH DƯỠNG & THỐNG KÊ NGÀY */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4">
            {/* THANH DỰ BÁO NGÂN SÁCH CALO HÔM NAY */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  Ngân sách Calo Hôm Nay: <strong className="text-white">{targetCalories} kcal</strong>
                </span>
                <span className="font-black text-lime-400">
                  {scanResult
                    ? `${currentCalories} + ${scanResult.calories} = ${projectedCalories} kcal (${projectedPercent}%)`
                    : `Đã nạp: ${currentCalories} kcal (${currentPercent}%)`}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
                <div
                  style={{ width: `${currentPercent}%` }}
                  className="h-full bg-emerald-500 transition-all duration-300"
                />
                {scanResult && (
                  <div
                    style={{
                      width: `${Math.max(0, projectedPercent - currentPercent)}%`,
                    }}
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 animate-pulse transition-all duration-300"
                  />
                )}
              </div>
            </div>

            {/* NỘI DUNG PHÂN TÍCH CHÍNH */}
            {!preview && !scanning && (
              <div className="flex-1 rounded-2xl bg-slate-900/40 border border-slate-800/80 p-8 flex flex-col items-center justify-center text-center">
                <Utensils className="w-12 h-12 text-slate-600 mb-3" />
                <h4 className="text-sm font-bold text-slate-300 mb-1">
                  Chưa có dữ liệu quét món ăn
                </h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Hãy chọn một bức ảnh món ăn ở khung bên trái. Hệ thống sẽ tự động kiểm duyệt ảnh, ước lượng số gram và tính toán Calo, Protein, Carbs, Fat.
                </p>
              </div>
            )}

            {scanning && (
              <div className="flex-1 rounded-2xl bg-slate-900/70 border border-orange-500/30 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-400 flex items-center justify-center mb-3 animate-spin">
                  <Sparkles className="w-6 h-6 text-orange-400" />
                </div>
                <h4 className="text-sm font-black uppercase italic text-orange-300 mb-1">
                  Đang bóc tách thành phần dinh dưỡng...
                </h4>
                <p className="text-xs text-slate-400">
                  Đang nhận diện món ăn và tính toán Calo & Macro
                </p>
              </div>
            )}

            {!scanning && refusalMsg && (
              <div className="flex-1 rounded-2xl bg-amber-500/10 border-2 border-amber-400/40 p-6 flex flex-col justify-center">
                <div className="flex items-center gap-2.5 text-amber-400 font-black uppercase italic text-sm mb-2">
                  <ShieldAlert className="w-6 h-6 shrink-0" />
                  {isUnrelated ? 'Ảnh Ngoài Danh Mục Thực Phẩm' : 'Thông Báo Xử Lý'}
                </div>
                <p className="text-xs text-amber-100 leading-relaxed mb-4">
                  {refusalMsg}
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase cursor-pointer hover:bg-amber-300"
                  >
                    📷 Chọn Lại Ảnh Món Ăn Thật
                  </button>
                </div>
              </div>
            )}

            {!scanning && scanResult && (
              <div className="flex-1 flex flex-col justify-between gap-4">
                {/* TIÊU ĐỀ MÓN & KHỐI LƯỢNG */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">
                        Món ăn nhận diện
                      </span>
                      <h3 className="text-xl font-black text-white">
                        🍲 {scanResult.food_name || scanResult.dish_name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="whitespace-nowrap inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-800 text-amber-300 text-xs font-black border border-amber-400/30">
                        <Scale className="w-3.5 h-3.5" /> ~{scanResult.portion_grams || 350}g
                      </span>
                    </div>
                  </div>

                  {/* 4 THẺ CHỈ SỐ MACRO RỘNG RÃI, KHÔNG BỊ RỚT DÒNG */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-orange-500/15 border border-orange-500/40">
                      <div className="text-[11px] font-bold text-orange-300">Tổng Calo</div>
                      <div className="text-xl font-black text-orange-400">
                        {scanResult.calories}
                        <span className="text-xs font-bold ml-1">kcal</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40">
                      <div className="text-[11px] font-bold text-emerald-300">Protein (Đạm)</div>
                      <div className="text-xl font-black text-emerald-400">
                        {scanResult.protein}
                        <span className="text-xs font-bold ml-0.5">g</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {scanResult.protein * 4} kcal
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-sky-500/15 border border-sky-500/40">
                      <div className="text-[11px] font-bold text-sky-300">Carbs (Bột)</div>
                      <div className="text-xl font-black text-sky-400">
                        {scanResult.carbs}
                        <span className="text-xs font-bold ml-0.5">g</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {scanResult.carbs * 4} kcal
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40">
                      <div className="text-[11px] font-bold text-amber-300">Fat (Béo)</div>
                      <div className="text-xl font-black text-amber-400">
                        {scanResult.fat}
                        <span className="text-xs font-bold ml-0.5">g</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {scanResult.fat * 9} kcal
                      </div>
                    </div>
                  </div>

                  {/* BẢNG BÓC TÁCH TỪNG THÀNH PHẦN (NẾU CÓ) */}
                  {Array.isArray(scanResult.breakdown) && scanResult.breakdown.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <div className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                        Chi tiết thành phần trên đĩa:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {scanResult.breakdown.map((b, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                          >
                            <span className="font-semibold text-slate-200 truncate">
                              • {b.item || b.name} ({b.grams || 100}g)
                            </span>
                            <span className="text-orange-400 font-bold ml-2 shrink-0">
                              {b.calories || ''} kcal
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* NHẬN XÉT CỦA HLV AI */}
                  {scanResult.notes && (
                    <div className="mt-3 px-3 py-2 rounded-xl bg-lime-400/10 border border-lime-400/30 text-xs text-lime-200 flex items-start gap-2">
                      <Activity className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                      <span>{scanResult.notes}</span>
                    </div>
                  )}
                </div>

                {/* CHỌN BỮA ĂN (PILL SELECTOR) & NÚT CỘNG VÀO THỐNG KÊ NGÀY */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-300">
                      Ghi nhận vào bữa:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {MEAL_TYPES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setMealType(t.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            mealType === t.id
                              ? 'bg-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20'
                              : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          {t.icon} {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {savedSuccess ? (
                    <div className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-black text-center text-sm flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" /> Đã cộng +{scanResult.calories} kcal vào Thống kê Hôm nay!
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleAddToDailyStats}
                      className="cursor-pointer w-full py-3 rounded-xl bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-400 hover:from-lime-300 hover:to-emerald-300 text-slate-950 font-black italic uppercase tracking-wide text-sm shadow-xl shadow-lime-500/25 flex items-center justify-center gap-2 transition-all"
                    >
                      <Plus className="w-5 h-5 stroke-[3]" />
                      {saving
                        ? 'Đang cập nhật thống kê...'
                        : `Cộng +${scanResult.calories} Kcal Vào Thống Kê Hôm Nay`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalUI, document.body);
}