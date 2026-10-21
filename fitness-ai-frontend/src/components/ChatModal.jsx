// src/components/ChatModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { fetchMessages, sendMessage, fetchConversations, askLocalAiCoach, addPtClientExercise } from '../services/api';
import audioCoach from '../services/audioCoach';
import { 
    Users, MessageSquare, Sparkles, Send, Volume2, VolumeX, 
    Maximize2, Minimize2, X, Search, CheckCheck, Clock, User, 
    ChevronRight, Dumbbell, ShieldCheck, Flame, AlertCircle, 
    PlusCircle, Check, Plus
} from 'lucide-react';

export default function ChatModal({ 
    isOpen, 
    onClose, 
    defaultPartnerId = null, 
    defaultPartnerName = 'Huấn Luyện Viên',
    initialMode = null,
    clientsList = [],
    selectedClientContext = null
}) {
    const currentUserId = parseInt(localStorage.getItem('fitness_user_id'), 10);
    const userRole = localStorage.getItem('fitness_role') || 'member';
    const isPt = userRole === 'pt';

    // Mode: 'ai' (AI Assistant) | 'pt' (1-on-1 Chat)
    const [chatMode, setChatMode] = useState(initialMode || (isPt ? 'pt' : 'ai'));

    // State cho 1-1 Chat
    const [messages, setMessages] = useState([]);
    const [partner, setPartner] = useState(null);
    const [activePartnerId, setActivePartnerId] = useState(defaultPartnerId);
    const [conversations, setConversations] = useState([]);
    const [studentSearch, setStudentSearch] = useState('');

    // Context học viên khi PT hỏi AI
    const [attachedClient, setAttachedClient] = useState(selectedClientContext || null);

    // Modal thêm bài tập ngay trên khung chat cho học viên
    const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
    const [exForm, setExForm] = useState({
        name: '',
        target_muscle: 'Cơ Ngực (Chest)',
        sets: 3,
        reps: '10-12',
        weight: '',
        notes: ''
    });
    const [addingExercise, setAddingExercise] = useState(false);
    const [addExerciseToast, setAddExerciseToast] = useState('');

    // State cho AI Chat
    const [aiMessages, setAiMessages] = useState(
        isPt ? [
            {
                id: 'init-pt-ai',
                role: 'assistant',
                sender_id: 'ai',
                content: 'Chào Huấn luyện viên! Tôi là Trợ lý Cố vấn AI Chuyên Môn dành riêng cho PT.\n\nTôi sẵn sàng hỗ trợ Coach phân tích chuyển động (Biomechanics), gợi ý bài tập thay thế cho ca học viên đau khớp/chấn thương, thiết kế chu kỳ Periodization (Hypertrophy / Deload) hoặc tính toán Macro chi tiết. Coach cần em hỗ trợ ca học viên nào hôm nay ạ?',
                created_at: new Date().toISOString()
            }
        ] : [
            {
                id: 'init-member-ai',
                role: 'assistant',
                sender_id: 'ai',
                content: 'Chào bạn! Mình là Coach Đào Chi - Huấn luyện viên thể hình cá nhân & Chuyên gia dinh dưỡng thể thao.\n\nHôm nay bạn muốn Coach hỗ trợ về kỹ thuật form bài tập, tính toán lượng Protein/Calo hay lên thực đơn tăng cơ giảm mỡ khoa học nào?',
                created_at: new Date().toISOString()
            }
        ]
    );

    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [speakingMsgId, setSpeakingMsgId] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const messagesEndRef = useRef(null);

    // Quick Prompts
    const QUICK_PROMPTS_PT_AI = [
        '🩹 Bài tập thay thế Squat cho học viên đau khớp gối',
        '📈 Lộ trình 8 tuần Hypertrophy tăng cơ xô & ngực',
        '⚖️ Xử lý học viên bị chững cân dù thâm hụt calo',
        '🥗 Tính Macro Bulking sạch cho nam 70kg',
        '🎯 Lời nhắn khéo léo cho học viên hay bỏ buổi tập',
        '⚡ Cách hướng dẫn học viên gồng Core Bracing chuẩn'
    ];

    const QUICK_PROMPTS_MEMBER_AI = [
        '🥩 Tính lượng Protein & Calo tăng cơ tối ưu cho tôi',
        '🏋️ Hướng dẫn kỹ thuật chuẩn form Barbell Squat',
        '🍱 Gợi ý thực đơn Eat Clean 2000 kcal nhiều đạm Việt Nam',
        '💊 Cách dùng Whey Protein & Creatine hiệu quả nhất',
        '💪 Lịch tập 4 buổi/tuần tăng cơ ngực và xô lưng'
    ];

    const QUICK_TEMPLATES_PT_TO_CLIENT = [
        '💪 Chào em, hôm nay tập rất tốt! Nhớ bổ sung đủ nước và 150g protein nhé.',
        '📅 Lịch tập buổi tới của em đã sẵn sàng, nhớ đến đúng giờ nhé!',
        '🥗 Thực đơn hôm nay của em rất chuẩn Eat Clean, tiếp tục phát huy!',
        '⚠️ Chú ý siết chặt cơ bụng và thở đều ở hiệp cuối động tác gánh tạ nhé.'
    ];

    const QUICK_TEMPLATES_CLIENT_TO_PT = [
        '🏋️ Chào Coach, em cần hỏi về kỹ thuật gánh tạ Squat đúng form ạ!',
        '🥗 Coach xem giúp em thực đơn hôm nay đã đủ Protein chưa ạ?',
        '📅 Coach ơi, em muốn dời lịch tập buổi tới sang chiều mai được không?',
        '🔥 Em vừa hoàn thành buổi tập hôm nay, cảm thấy cơ bắp rất căng!'
    ];

    // Gợi ý bài tập nhanh để PT 1-click điền form
    const EXERCISE_PRESETS = [
        { name: 'Barbell Back Squat', target_muscle: 'Cơ Đùi Trước & Mông', sets: 4, reps: '8-10 reps', weight: '50-60 kg', notes: 'Giữ cẳng chân thẳng góc, gồng chắc core, không nhấc gót' },
        { name: 'Incline Dumbbell Press', target_muscle: 'Cơ Ngực Trên', sets: 3, reps: '10-12 reps', weight: '14-16 kg', notes: 'Ghế dốc 30-45 độ, hạ tạ kiểm soát 3s, khóa khớp cổ tay' },
        { name: 'Lat Pulldown', target_muscle: 'Cơ Xô & Lưng Trên', sets: 4, reps: '10-12 reps', weight: '40-45 kg', notes: 'Kéo thanh đòn về ngang xương quai xanh, ép chặt bả vai' },
        { name: 'Romanian Deadlift (RDL)', target_muscle: 'Cơ Đùi Sau & Mông', sets: 3, reps: '10-12 reps', weight: '40 kg', notes: 'Đẩy hông ra sau (hip hinge), giữ lưng thẳng tuyệt đối' },
        { name: 'Dumbbell Lateral Raise', target_muscle: 'Cơ Vai Giữa', sets: 4, reps: '12-15 reps', weight: '6-8 kg', notes: 'Cùi chỏ hơi cong, nâng tạ bằng cơ vai không dùng đà' },
        { name: 'Plank Core Bracing', target_muscle: 'Cơ Bụng & Lõi (Core)', sets: 3, reps: '45-60 giây', weight: 'Bodyweight', notes: 'Siết mông, rút rốn vào cột sống, thở đều liên tục' }
    ];

    // Scroll to bottom helper
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, aiMessages]);

    // Load Conversations & Auto-select Partner
    const loadConversations = async () => {
        try {
            const res = await fetchConversations();
            if (res.success && res.conversations) {
                setConversations(res.conversations);

                // Auto-route for Member: Nếu có tin nhắn chưa đọc từ PT, tự động chọn PT đó và bật tab HLV!
                if (!isPt) {
                    const unreadConv = res.conversations.find(c => parseInt(c.unread_count, 10) > 0);
                    if (unreadConv) {
                        setActivePartnerId(unreadConv.partner_id);
                        setPartner({
                            id: unreadConv.partner_id,
                            full_name: unreadConv.partner_name,
                            email: unreadConv.partner_email
                        });
                        setChatMode('pt');
                        return;
                    }

                    // Nếu chưa có activePartnerId hoặc partner hiện tại không có tin nhắn nhưng đối tác khác có
                    if (!activePartnerId && res.conversations.length > 0) {
                        setActivePartnerId(res.conversations[0].partner_id);
                        setPartner({
                            id: res.conversations[0].partner_id,
                            full_name: res.conversations[0].partner_name,
                            email: res.conversations[0].partner_email
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Lỗi tải hội thoại:', err);
        }
    };

    const loadChatHistory = async (targetId) => {
        if (!targetId) return;
        try {
            const res = await fetchMessages(targetId);
            if (res.success) {
                setMessages(res.messages || []);
                if (res.partner) {
                    setPartner(res.partner);
                }
            }
        } catch (err) {
            console.error('Lỗi tải tin nhắn:', err);
        }
    };

    // Khi Modal mở
    useEffect(() => {
        if (isOpen) {
            if (initialMode) {
                setChatMode(initialMode);
            }
            if (selectedClientContext) {
                setAttachedClient(selectedClientContext);
            }

            loadConversations();

            if (defaultPartnerId) {
                setActivePartnerId(defaultPartnerId);
                loadChatHistory(defaultPartnerId);
            }
        }
    }, [isOpen, defaultPartnerId, initialMode, selectedClientContext]);

    // Polling realtime khi đang mở modal ở chế độ 1-1
    useEffect(() => {
        if (isOpen && activePartnerId && chatMode === 'pt') {
            loadChatHistory(activePartnerId);
            const interval = setInterval(() => {
                loadChatHistory(activePartnerId);
                loadConversations();
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [isOpen, activePartnerId, chatMode]);

    // Voice reading subscription
    useEffect(() => {
        const unsub = audioCoach.subscribe(state => {
            setSpeakingMsgId(state.speaking ? state.speakingMsgId : null);
        });
        return () => {
            unsub();
            audioCoach.stop();
        };
    }, []);

    const handleToggleSpeak = (msgId, text) => {
        if (speakingMsgId === msgId) {
            audioCoach.stop();
        } else {
            audioCoach.speak(text, true, msgId);
        }
    };

    const handleClose = () => {
        audioCoach.stop();
        onClose();
    };

    if (!isOpen) return null;

    // Gửi tin nhắn thông thường
    const handleSend = async (textToSend = null) => {
        const text = textToSend || newMessage;
        if (!text || !text.trim() || sending) return;

        // MODE 1: AI CHAT
        if (chatMode === 'ai') {
            const userMsg = {
                id: 'user-' + Date.now(),
                role: 'user',
                sender_id: currentUserId,
                content: text.trim(),
                created_at: new Date().toISOString()
            };

            setAiMessages(prev => [...prev, userMsg]);
            setNewMessage('');
            setSending(true);

            try {
                const res = await askLocalAiCoach(text.trim(), aiMessages, {
                    assistantType: isPt ? 'pt_assistant' : 'trainee_coach',
                    clientContext: isPt ? (attachedClient || selectedClientContext) : null
                });

                const aiReply = {
                    id: 'ai-' + Date.now(),
                    role: 'assistant',
                    sender_id: 'ai',
                    content: res.reply || 'Hệ thống AI đã nhận thông tin của bạn!',
                    model: res.model || (isPt ? 'pt-specialist' : 'fitness-coach'),
                    provider: res.provider || 'AI Engine',
                    created_at: new Date().toISOString()
                };
                setAiMessages(prev => [...prev, aiReply]);
            } catch (err) {
                setAiMessages(prev => [
                    ...prev,
                    {
                        id: 'ai-err-' + Date.now(),
                        role: 'assistant',
                        sender_id: 'ai',
                        content: '⚠️ Trợ lý AI hiện chưa thể phản hồi lúc này. Vui lòng thử lại sau giây lát!',
                        created_at: new Date().toISOString()
                    }
                ]);
            } finally {
                setSending(false);
            }
            return;
        }

        // MODE 2: DIRECT 1-1 CHAT
        if (!activePartnerId) return;
        setSending(true);
        try {
            const res = await sendMessage({
                receiverId: activePartnerId,
                content: text.trim(),
                messageType: 'text'
            });

            if (res.success) {
                setNewMessage('');
                await loadChatHistory(activePartnerId);
                await loadConversations();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Không thể gửi tin nhắn.');
        } finally {
            setSending(false);
        }
    };

    // XỬ LÝ THÊM BÀI TẬP TRỰC TIẾP TỪ KHUNG CHAT
    const handleAddExerciseSubmit = async (e) => {
        e.preventDefault();
        const targetClientId = activePartnerId || attachedClient?.client_id || attachedClient?.id;
        if (!targetClientId) {
            alert('Vui lòng chọn học viên cần thêm bài tập.');
            return;
        }

        if (!exForm.name.trim()) {
            alert('Vui lòng nhập tên bài tập.');
            return;
        }

        setAddingExercise(true);
        try {
            const res = await addPtClientExercise(targetClientId, {
                name: exForm.name,
                target_muscle: exForm.target_muscle,
                sets: exForm.sets,
                reps: exForm.reps,
                weight: exForm.weight,
                notes: exForm.notes,
                sendChatMessage: true
            });

            if (res.status === 'success') {
                // Đóng modal và reset form
                setShowAddExerciseModal(false);
                setExForm({
                    name: '',
                    target_muscle: 'Cơ Ngực (Chest)',
                    sets: 3,
                    reps: '10-12',
                    weight: '',
                    notes: ''
                });

                // Hiển thị toast thông báo
                setAddExerciseToast(`✨ Đã thêm bài "${res.exercise.name}" vào giáo án học viên!`);
                setTimeout(() => setAddExerciseToast(''), 4000);

                // Tải lại lịch sử chat để cập nhật card bài tập mới gửi
                if (activePartnerId) {
                    await loadChatHistory(activePartnerId);
                    await loadConversations();
                }
            }
        } catch (err) {
            alert('⚠️ Lỗi khi thêm bài tập: ' + (err.response?.data?.message || err.message));
        } finally {
            setAddingExercise(false);
        }
    };

    // Chuẩn bị danh sách học viên cho PT (kết hợp clientsList và conversations)
    const allPtClients = (() => {
        if (!isPt) return [];
        const map = new Map();
        
        // 1. Thêm từ clientsList của PT
        clientsList.forEach(c => {
            map.set(c.client_id, {
                id: c.client_id,
                name: c.full_name || 'Học viên',
                email: c.email,
                phone: c.phone,
                package: c.package_name || 'Gói tập',
                remaining_sessions: c.remaining_sessions,
                total_sessions: c.total_sessions,
                unread_count: 0
            });
        });

        // 2. Thêm và update unread count từ conversations
        conversations.forEach(c => {
            const existing = map.get(c.partner_id);
            if (existing) {
                existing.unread_count = parseInt(c.unread_count, 10) || 0;
                existing.last_message = c.last_message;
                existing.last_message_time = c.last_message_time;
            } else {
                map.set(c.partner_id, {
                    id: c.partner_id,
                    name: c.partner_name || c.partner_email?.split('@')[0] || 'Học viên',
                    email: c.partner_email,
                    package: 'Học viên',
                    remaining_sessions: 0,
                    total_sessions: 0,
                    unread_count: parseInt(c.unread_count, 10) || 0,
                    last_message: c.last_message,
                    last_message_time: c.last_message_time
                });
            }
        });

        const list = Array.from(map.values());
        if (!studentSearch.trim()) return list;
        return list.filter(s => 
            s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            (s.email && s.email.toLowerCase().includes(studentSearch.toLowerCase())) ||
            (s.phone && s.phone.includes(studentSearch))
        );
    })();

    // Tên hiển thị của đối tác đang chat
    const currentActiveClient = isPt ? allPtClients.find(s => s.id === activePartnerId) : null;
    const partnerDisplayName = isPt 
        ? (currentActiveClient?.name || partner?.full_name || defaultPartnerName || 'Học Viên')
        : (partner?.full_name || defaultPartnerName || 'Coach Huấn Luyện Viên');

    // UI CHAT CONTENT
    const chatCard = (
        <div className={`bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl relative border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300 ${
            isExpanded
                ? 'max-w-6xl w-full h-[90vh]'
                : isPt
                    ? 'w-[96vw] sm:w-[720px] md:w-[780px] h-[660px] max-h-[85vh]'
                    : 'w-[94vw] sm:w-[460px] md:w-[500px] h-[600px] max-h-[85vh]'
        }`}>

            {/* TOAST THÔNG BÁO THÊM BÀI TẬP */}
            {addExerciseToast && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-400 animate-bounce">
                    <Check className="w-4 h-4" />
                    <span>{addExerciseToast}</span>
                </div>
            )}

            {/* TOP HEADER: SWITCH TABS & CONTROLS */}
            <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/95 dark:bg-slate-950/85 shrink-0">
                {/* Left: Tab Switcher */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-800/90 rounded-2xl border border-slate-300/80 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={() => setChatMode('ai')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                            chatMode === 'ai'
                                ? isPt 
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                                    : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>{isPt ? '🤖' : '🧘‍♀️'}</span>
                        <span>{isPt ? 'Hỏi Đáp Với AI Của PT' : 'Coach Đào Chi AI'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setChatMode('pt')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 relative ${
                            chatMode === 'pt'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>{isPt ? '👥' : '👤'}</span>
                        <span>{isPt ? 'Từng Học Viên Riêng Biệt' : 'HLV 1-1'}</span>
                        {/* Red Dot if any conversation has unread */}
                        {conversations.some(c => parseInt(c.unread_count, 10) > 0) && (
                            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
                        )}
                    </button>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer transition text-xs"
                        title={isExpanded ? "Thu nhỏ cửa sổ" : "Mở rộng toàn màn hình"}
                    >
                        {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer transition text-xs"
                        title="Đóng chat"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* AI SUB-HEADER: Context Attachment Bar for PT */}
            {chatMode === 'ai' && isPt && (
                <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/80 dark:border-amber-900/40 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="font-bold text-amber-900 dark:text-amber-300">
                            {attachedClient ? `Ngữ cảnh học viên: ${attachedClient.full_name || 'Đã chọn'}` : 'Chế độ Cố vấn Chuyên môn Chung'}
                        </span>
                        {attachedClient && attachedClient.weight && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200/60 dark:bg-amber-800/40 font-mono">
                                {attachedClient.weight}kg • {attachedClient.height}cm • {attachedClient.goal}
                            </span>
                        )}
                    </div>

                    {/* Quick attach dropdown & add exercise button */}
                    <div className="flex items-center gap-2">
                        {allPtClients.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">Gắn học viên:</span>
                                <select
                                    value={attachedClient?.client_id || attachedClient?.id || ''}
                                    onChange={(e) => {
                                        const found = clientsList.find(c => c.client_id === parseInt(e.target.value, 10));
                                        setAttachedClient(found || null);
                                    }}
                                    className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                                >
                                    <option value="">-- Cố vấn tổng quát (Không gắn) --</option>
                                    {clientsList.map(c => (
                                        <option key={c.client_id} value={c.client_id}>
                                            {c.full_name} ({c.weight || 70}kg - {c.goal || 'Tập gym'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {attachedClient && (
                            <button
                                type="button"
                                onClick={() => {
                                    setActivePartnerId(attachedClient.client_id || attachedClient.id);
                                    setShowAddExerciseModal(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-xs"
                                title="Thêm ngay bài tập vừa trao đổi với AI vào giáo án học viên"
                            >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Thêm Bài Cho Học Viên</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* MEMBER SUB-HEADER: PT Coach Switcher Bar (Fix lỗi học viên không thấy tin nhắn của PT khác) */}
            {chatMode === 'pt' && !isPt && conversations.length > 0 && (
                <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        HLV của bạn:
                    </span>
                    {conversations.map(c => {
                        const isCurrent = activePartnerId === c.partner_id;
                        const unread = parseInt(c.unread_count, 10) || 0;
                        return (
                            <button
                                key={c.partner_id}
                                onClick={() => {
                                    setActivePartnerId(c.partner_id);
                                    setPartner({
                                        id: c.partner_id,
                                        full_name: c.partner_name,
                                        email: c.partner_email
                                    });
                                    loadChatHistory(c.partner_id);
                                }}
                                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap text-xs border ${
                                    isCurrent
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800'
                                }`}
                            >
                                <span>👤 {c.partner_name || c.partner_email?.split('@')[0]}</span>
                                {unread > 0 && (
                                    <span className="w-4 h-4 bg-rose-600 text-white text-[10px] rounded-full flex items-center justify-center font-black animate-bounce">
                                        {unread}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* MAIN BODY AREA: SPLIT PANE FOR PT 1-1 OR SINGLE PANE FOR AI */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* LEFT PANE FOR PT: DANH SÁCH TỪNG HỌC VIÊN RIÊNG BIỆT */}
                {chatMode === 'pt' && isPt && (
                    <div className="w-56 sm:w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-col shrink-0">
                        {/* Search in student list */}
                        <div className="p-2.5 border-b border-slate-200 dark:border-slate-800/80">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Tìm học viên..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-8 pr-2.5 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Scrollable list */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                            {allPtClients.length === 0 ? (
                                <div className="py-8 text-center text-xs text-slate-400">
                                    Chưa có học viên nào.
                                </div>
                            ) : (
                                allPtClients.map(client => {
                                    const isSelected = activePartnerId === client.id;
                                    return (
                                        <div
                                            key={client.id}
                                            onClick={() => {
                                                setActivePartnerId(client.id);
                                                setPartner({
                                                    id: client.id,
                                                    name: client.name,
                                                    email: client.email
                                                });
                                                loadChatHistory(client.id);
                                            }}
                                            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                                isSelected
                                                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
                                                    : 'bg-white dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                        {client.name}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                                        {client.remaining_sessions > 0 ? `${client.remaining_sessions} buổi` : client.package}
                                                    </p>
                                                </div>
                                            </div>

                                            {client.unread_count > 0 && (
                                                <span className="w-5 h-5 bg-rose-600 text-white text-[10px] rounded-full flex items-center justify-center font-black animate-bounce shrink-0">
                                                    {client.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* RIGHT PANE: MESSAGES STREAM */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">

                    {/* Active Partner Info Header in 1-1 Mode */}
                    {chatMode === 'pt' && (
                        <div className="p-3 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-white/60 dark:bg-slate-900/60 shrink-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                                    {partnerDisplayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                        <span>{partnerDisplayName}</span>
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    </h4>
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold truncate">
                                        {isPt ? 'Kênh chat 1-1 trực tiếp với học viên' : 'Kênh trao đổi riêng cùng Huấn luyện viên'}
                                    </p>
                                </div>
                            </div>

                            {/* PT Quick Action: Thêm bài tập cho học viên */}
                            {isPt && activePartnerId && (
                                <button
                                    type="button"
                                    onClick={() => setShowAddExerciseModal(true)}
                                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm active:scale-95 shrink-0"
                                    title="Thêm trực tiếp một bài tập mới vào giáo án của học viên này"
                                >
                                    <Dumbbell className="w-4 h-4" />
                                    <span>+ Thêm Bài Tập Ngay</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Messages Body */}
                    <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 custom-scrollbar">
                        {chatMode === 'ai' ? (
                            aiMessages.map(msg => {
                                const isMe = msg.role === 'user';
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1.5`}
                                    >
                                        <div
                                            className={`max-w-[90%] sm:max-w-[82%] p-3.5 sm:p-4 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                                                isMe
                                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs'
                                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-bl-xs'
                                            }`}
                                        >
                                            <div className="whitespace-pre-wrap font-medium">
                                                {msg.content}
                                            </div>
                                        </div>

                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 px-1 font-medium flex items-center gap-2">
                                            <span>{new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                            {!isMe && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleSpeak(msg.id, msg.content)}
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer border ${
                                                            speakingMsgId === msg.id
                                                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/50 animate-pulse'
                                                                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        {speakingMsgId === msg.id ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                                                        <span>{speakingMsgId === msg.id ? 'Dừng đọc' : 'Nghe giọng đọc'}</span>
                                                    </button>
                                                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                                                        • {isPt ? 'Trợ lý AI PT' : 'Coach Đào Chi'}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                                    <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-3xl font-bold border border-indigo-100 dark:border-transparent shadow-xs">
                                        💬
                                    </div>
                                    <div className="space-y-1 max-w-sm">
                                        <h4 className="font-black text-base text-slate-900 dark:text-white">
                                            Bắt đầu cuộc trò chuyện cùng {partnerDisplayName}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                            {isPt 
                                                ? 'Gửi lời dặn dò form bài tập, kiểm tra thực đơn hoặc thêm bài tập trực tiếp vào giáo án của học viên này!' 
                                                : 'Hỏi đáp kỹ thuật form, dinh dưỡng hoặc trao đổi lịch tập trực tiếp 1-1 với Huấn luyện viên!'}
                                        </p>
                                    </div>
                                    {isPt && activePartnerId && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddExerciseModal(true)}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                                        >
                                            <Dumbbell className="w-4 h-4" />
                                            <span>Thêm Bài Tập Đầu Tiên Cho Học Viên</span>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                messages.map(msg => {
                                    const isMe = msg.sender_id === currentUserId;
                                    const isWorkoutShare = msg.message_type === 'workout_share';

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                                        >
                                            {/* Custom rendering for Workout Share card vs Standard text */}
                                            {isWorkoutShare ? (
                                                <div className={`max-w-[90%] sm:max-w-[82%] p-4 rounded-3xl border-2 shadow-sm ${
                                                    isMe
                                                        ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/30 border-emerald-500 text-slate-900 dark:text-white rounded-br-xs'
                                                        : 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/40 border-emerald-400 dark:border-emerald-600 text-slate-900 dark:text-white rounded-bl-xs'
                                                }`}>
                                                    <div className="flex items-center justify-between gap-2 border-b border-emerald-200 dark:border-emerald-800/80 pb-2 mb-2">
                                                        <span className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400">
                                                            <Dumbbell className="w-4 h-4" />
                                                            BÀI TẬP MỚI ĐÃ THÊM VÀO GIÁO ÁN
                                                        </span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                                                            ✓ Đã Lưu
                                                        </span>
                                                    </div>
                                                    <p className="whitespace-pre-wrap font-medium text-xs sm:text-sm leading-relaxed">
                                                        {msg.content}
                                                    </p>
                                                    <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/50 mt-2 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                                                        <span>Lộ trình tập luyện đã cập nhật</span>
                                                        <span>🏋️</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className={`max-w-[85%] sm:max-w-[78%] p-3.5 sm:p-4 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                                                        isMe
                                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs'
                                                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-bl-xs'
                                                    }`}
                                                >
                                                    <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                                                </div>
                                            )}

                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 px-1 font-medium flex items-center gap-1.5">
                                                <span>{new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                {isMe && (
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5">
                                                        <CheckCheck className="w-3 h-3" />
                                                        <span>{msg.is_read ? 'Đã xem' : 'Đã gửi'}</span>
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    );
                                })
                            )
                        )}

                        {sending && (
                            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-bold animate-pulse p-2">
                                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                <span>{chatMode === 'ai' ? 'Trợ lý AI đang phân tích và soạn câu trả lời...' : 'Đang gửi tin nhắn...'}</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Prompts Bar */}
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
                        {(chatMode === 'ai' 
                            ? (isPt ? QUICK_PROMPTS_PT_AI : QUICK_PROMPTS_MEMBER_AI)
                            : (isPt ? QUICK_TEMPLATES_PT_TO_CLIENT : QUICK_TEMPLATES_CLIENT_TO_PT)
                        ).map((prompt, idx) => (
                            <button
                                key={idx}
                                type="button"
                                disabled={sending}
                                onClick={() => handleSend(prompt)}
                                className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition cursor-pointer shadow-2xs shrink-0 disabled:opacity-50"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>

                    {/* Input Area */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
                    >
                        {/* Nút thêm bài tập trực tiếp ngay thanh input (dành cho PT) */}
                        {isPt && activePartnerId && chatMode === 'pt' && (
                            <button
                                type="button"
                                onClick={() => setShowAddExerciseModal(true)}
                                className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition cursor-pointer shrink-0"
                                title="Thêm bài tập vào giáo án học viên"
                            >
                                <Dumbbell className="w-4 h-4" />
                            </button>
                        )}

                        <input
                            type="text"
                            placeholder={
                                chatMode === 'ai' 
                                    ? (isPt 
                                        ? 'Hỏi AI PT: bài tập thay thế, xử lý chấn thương, macro, periodization...' 
                                        : 'Hỏi Coach Đào Chi: kỹ thuật form, dinh dưỡng, calo/protein...')
                                    : `Nhắn tin cho ${partnerDisplayName}...`
                            }
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm px-4 py-2.5 rounded-2xl focus:outline-none focus:border-indigo-500 font-medium transition"
                        />

                        <button
                            type="submit"
                            disabled={sending || !newMessage.trim()}
                            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-black rounded-2xl transition shadow-md cursor-pointer disabled:opacity-40 flex items-center gap-1.5 active:scale-95 shrink-0"
                        >
                            <span>{sending ? 'Đang gửi...' : 'Gửi'}</span>
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </form>

                </div>

            </div>

            {/* MODAL POPUP: THÊM BÀI TẬP VÀO GIÁO ÁN HỌC VIÊN TRỰC TIẾP */}
            {showAddExerciseModal && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                    <Dumbbell className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        Thêm Bài Tập Vào Giáo Án
                                    </h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Học viên: <strong className="text-indigo-600 dark:text-indigo-400">{partnerDisplayName}</strong>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAddExerciseModal(false)}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition text-xs"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Quick Preset Chips */}
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Chọn nhanh bài tập mẫu:</span>
                            <div className="flex flex-wrap gap-1.5">
                                {EXERCISE_PRESETS.map((preset, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setExForm({
                                            name: preset.name,
                                            target_muscle: preset.target_muscle,
                                            sets: preset.sets,
                                            reps: preset.reps,
                                            weight: preset.weight,
                                            notes: preset.notes
                                        })}
                                        className="text-[10px] px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 font-bold transition cursor-pointer"
                                    >
                                        + {preset.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleAddExerciseSubmit} className="space-y-3 pt-1">
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                    Tên bài tập <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="VD: Barbell Bench Press, Bulgarian Split Squat..."
                                    value={exForm.name}
                                    onChange={(e) => setExForm({ ...exForm, name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        Nhóm cơ chính
                                    </label>
                                    <select
                                        value={exForm.target_muscle}
                                        onChange={(e) => setExForm({ ...exForm, target_muscle: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="Cơ Ngực (Chest)">Cơ Ngực (Chest)</option>
                                        <option value="Cơ Lưng & Xô (Back/Lats)">Cơ Lưng & Xô (Back/Lats)</option>
                                        <option value="Cơ Đùi Trước (Quads)">Cơ Đùi Trước (Quads)</option>
                                        <option value="Cơ Mông & Đùi Sau (Glutes/Hamstrings)">Cơ Mông & Đùi Sau</option>
                                        <option value="Cơ Vai (Shoulders)">Cơ Vai (Shoulders)</option>
                                        <option value="Cơ Tay Trước / Sau (Arms)">Cơ Tay Trước / Sau</option>
                                        <option value="Cơ Bụng & Lõi (Core/Abs)">Cơ Bụng & Lõi (Core)</option>
                                        <option value="Cardio & Sức Bền">Cardio & Sức Bền</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        Mức tạ / Cường độ
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="VD: 50 kg hoặc RPE 8"
                                        value={exForm.weight}
                                        onChange={(e) => setExForm({ ...exForm, weight: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        Số hiệp (Sets)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={exForm.sets}
                                        onChange={(e) => setExForm({ ...exForm, sets: parseInt(e.target.value, 10) || 3 })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        Số lần / Hiệp (Reps)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="VD: 10-12 reps hoặc 45s"
                                        value={exForm.reps}
                                        onChange={(e) => setExForm({ ...exForm, reps: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                    Lưu ý kỹ thuật &amp; Hướng dẫn của HLV
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="VD: Nhịp độ hạ chậm 3s, khóa khớp cổ tay, siết cơ bụng..."
                                    value={exForm.notes}
                                    onChange={(e) => setExForm({ ...exForm, notes: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddExerciseModal(false)}
                                    className="w-1/3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={addingExercise || !exForm.name.trim()}
                                    className="w-2/3 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {addingExercise ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Đang lưu...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Dumbbell className="w-3.5 h-3.5" />
                                            <span>Lưu Giáo Án &amp; Gửi Tin Nhắn 🚀</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );

    if (isExpanded) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-fadeIn">
                {chatCard}
            </div>
        );
    }

    return (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 animate-slideUp">
            {chatCard}
        </div>
    );
}
