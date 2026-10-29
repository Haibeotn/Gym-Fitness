import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Zap,
  Dumbbell,
  Minus,
  Plus,
  History,
  Search,
  Send,
  Trash2,
  Star,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  Loader2,
  Maximize2,
  Minimize2,
  ShieldAlert,
  Camera,
  Activity,
} from 'lucide-react';

// Lấy User ID chính xác từ currentUser hoặc localStorage (fitness_user_id / fitness_token)
function getCurrentActiveUserId(currentUser) {
  if (currentUser?.id) return String(currentUser.id);
  const storedId = localStorage.getItem('fitness_user_id');
  if (storedId) return String(storedId);
  const token = localStorage.getItem('fitness_token');
  if (token) {
    try {
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const decoded = JSON.parse(atob(payloadBase64));
        if (decoded.id || decoded.userId) return String(decoded.id || decoded.userId);
      }
    } catch (_) {}
  }
  return 'guest';
}

function getUserChatStorageKey(userId) {
  return `fitness_user_${userId}_ai_coach_sessions_v3`;
}

const QUICK_PROMPTS = [
  '💪 Thiết kế buổi tập Ngực - Tay sau 45 phút tránh đau khớp vai',
  '🔥 Tính TDEE và thực đơn 2000 kcal giảm mỡ tăng cơ',
  '🛡️ Bị đau lưng dưới nên tập bài Lưng - Chân nào an toàn?',
  '⚡ Lịch tập 4 buổi Upper - Lower tối ưu tăng cơ (Hypertrophy)',
];

function detectCategory(text = '') {
  const lower = text.toLowerCase();
  if (
    lower.includes('calo') ||
    lower.includes('ăn') ||
    lower.includes('thực đơn') ||
    lower.includes('protein') ||
    lower.includes('tdee')
  ) {
    return 'nutrition';
  }
  return 'workout';
}

// Hàm định dạng văn bản inline: Xóa dấu ** và tô màu các chỉ số khoa học (Sets, Reps, RPE, kcal, gram)
function formatInlineScientific(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const clean = part.slice(2, -2);
      return (
        <strong key={idx} className="text-lime-300 font-extrabold">
          {clean}
        </strong>
      );
    }

    // Highlight các chỉ số định lượng (Sets, Reps, RPE, kcal, phút, giây)
    const tokenRegex =
      /(\b\d+(?:-\d+)?\s*(?:Sets|sets|hiệp|Reps|reps|lần|kcal|g\s*Protein|g\s*Carbs|g\s*Fat|phút|giây|s)\b|\bRPE\s*\d+(?:\.\d+)?(?:-\d+)?\b)/gi;
    const subParts = part.split(tokenRegex);
    if (subParts.length === 1) return part;

    return subParts.map((sub, sIdx) => {
      if (tokenRegex.test(sub)) {
        return (
          <span
            key={sIdx}
            className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold text-[11px]"
          >
            {sub}
          </span>
        );
      }
      return sub;
    });
  });
}

// Component hiển thị nội dung AI theo chuẩn Giáo án Khoa học
function ScientificMessageRenderer({ content }) {
  if (!content) return null;
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-[12.5px] leading-relaxed">
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();
        if (!line) return <div key={index} className="h-1" />;

        // 1. Tiêu đề Mục lớn (### hoặc ####)
        if (/^#{1,4}\s+/.test(line)) {
          const titleText = line.replace(/^#{1,4}\s+/, '').replace(/\*\*/g, '');
          return (
            <div
              key={index}
              className="mt-3 mb-1.5 flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-lime-400/15 via-emerald-500/10 to-transparent border-l-4 border-lime-400"
            >
              <Activity className="w-4 h-4 text-lime-400 shrink-0" />
              <h4 className="font-black uppercase tracking-wide text-lime-300 text-xs">
                {titleText}
              </h4>
            </div>
          );
        }

        // 2. Hộp Lưu ý An toàn / Cảnh báo Chấn thương / Mẹo
        if (
          /^(?:-\s*)?(?:\*\*)?(?:Lưu ý|Cảnh báo|An toàn|Kỹ thuật chuẩn|💡|⚠️|🛡️)/i.test(
            line
          )
        ) {
          const cleanNote = line.replace(/^-\s*/, '');
          return (
            <div
              key={index}
              className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-100 text-xs"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">{formatInlineScientific(cleanNote)}</div>
            </div>
          );
        }

        // 3. Dòng danh sách Bài tập / Bullet point (- hoặc * hoặc 1.)
        if (/^(?:[-*•]|\d+\.)\s+/.test(line)) {
          const isSubBullet = rawLine.startsWith('  ') || rawLine.startsWith('\t');
          const cleanBullet = line.replace(/^(?:[-*•]|\d+\.)\s+/, '');

          return (
            <div
              key={index}
              className={`flex items-start gap-2 ${
                isSubBullet
                  ? 'ml-4 pl-2.5 border-l border-slate-700 text-slate-300 text-xs py-0.5'
                  : 'p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 text-slate-100'
              }`}
            >
              <span
                className={`mt-1.5 rounded-full shrink-0 ${
                  isSubBullet
                    ? 'w-1.5 h-1.5 bg-emerald-400/70'
                    : 'w-2 h-2 bg-lime-400 shadow-sm shadow-lime-400'
                }`}
              />
              <div className="flex-1">{formatInlineScientific(cleanBullet)}</div>
            </div>
          );
        }

        // 4. Đoạn văn bản thông thường
        return (
          <p key={index} className="text-slate-200 px-0.5">
            {formatInlineScientific(line)}
          </p>
        );
      })}
    </div>
  );
}

function createNewSession(userName = '') {
  const now = new Date().toISOString();
  const greeting = userName ? `Chào **${userName}**!` : 'Chào bạn!';
  return {
    id: 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    title: 'Giáo án tư vấn mới',
    category: 'workout',
    pinned: false,
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: 'welcome_' + Date.now(),
        role: 'assistant',
        content:
          `### ⚡ Trung tâm Huấn luyện Thể thao AI\n${greeting} Tôi là **FitnessAI Coach**. Tôi thiết kế giáo án cá nhân hóa theo thể trạng, định lượng **Sets x Reps | RPE** và dinh dưỡng phù hợp.\n- **Thu nhỏ thông minh**: Bạn có thể bấm nút **Thu nhỏ (—)** lúc tôi đang suy nghĩ mà không lo mất tiến trình.\n- **Lưu trữ riêng biệt**: Lịch sử trò chuyện và giáo án được lưu riêng theo tài khoản của bạn.`,
        timestamp: now,
      },
    ],
  };
}

function loadUserChatSessions(userId, userName = '') {
  const key = getUserChatStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return [createNewSession(userName)];
}

async function streamAiCoachReply(userText, historyMessages, onChunk) {
  let ragContext = '';
  let ragFooter = '';

  // Bước 1: Lấy Micro-RAG từ RAM Cache của Backend (chỉ mất ~2-3ms, timeout tối đa 600ms)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 600);
    const ragRes = await fetch('http://localhost:3000/api/rag-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (ragRes.ok) {
      const ragData = await ragRes.json();
      if (ragData.success) {
        ragContext = ragData.compactRagPrompt || '';
        const m = ragData.meta || {};
        const sample = (m.dbExercisesSample || []).join(', ');
        ragFooter = sample ? `\n\n💡 Tham khảo từ hệ thống bài tập: ${sample}.` : '';
      }
    }
  } catch (_) {}

  // Bước 2: Stream token trực tiếp từ Ollama (hiện chữ ngay lập tức từ giây đầu tiên)
  const systemPrompt =
    'Bạn là FitnessAI Coach. Trả lời NGẮN GỌN, KHOA HỌC, đi thẳng vào trọng tâm (tối đa 250 từ). Chia mục bằng ###. Dùng tên bài tập chuẩn Việt-Anh. Định lượng: [Sets] x [Reps] | RPE [7-9] | Nghỉ [60-90s]. Bắt buộc dùng số liệu trong [DB] nếu có.\n' +
    ragContext;

  const ollamaRes = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'fitness-ai-coach',
      stream: true,
      keep_alive: '60m', // Giữ model luôn trong RAM/GPU không phải nạp lại
      options: {
        temperature: 0.2,
        top_p: 0.85,
        repeat_penalty: 1.18,
        num_ctx: 1536,    // Thu gọn context window để tăng tốc x2
        num_predict: 420, // Giới hạn độ dài súc tích, tránh lan man
      },
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages.slice(-4).map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content: userText },
      ],
    }),
  });

  if (!ollamaRes.ok || !ollamaRes.body) {
    throw new Error('Không thể kết nối Ollama');
  }

  const reader = ollamaRes.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunkText = decoder.decode(value, { stream: true });
    const lines = chunkText.split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.message?.content) {
          fullText += parsed.message.content;
          onChunk(fullText);
        }
      } catch (_) {}
    }
  }

  const finalOutput = fullText + (ragFooter || '');
  onChunk(finalOutput);
  return finalOutput;
}

async function requestAiCoachReply(userText, historyMessages, currentUser = null) {
  const userProfileContext = currentUser
    ? `[HỒ SƠ HỌC VIÊN HIỆN TẠI: Tên: ${currentUser.full_name || 'Học viên'}, Giới tính: ${currentUser.gender === 'female' ? 'Nữ' : 'Nam'}, Tuổi: ${currentUser.age || 24}, Cân nặng: ${currentUser.weight || 70}kg, Chiều cao: ${currentUser.height || 172}cm, Mục tiêu: ${currentUser.goal || 'Tăng cơ giảm mỡ'}] `
    : '';
  const contextualMessage = userProfileContext ? `${userProfileContext}\nCâu hỏi: ${userText}` : userText;

  try {
    const ragRes = await fetch('http://localhost:3000/api/rag-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: contextualMessage,
        history: historyMessages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });
    if (ragRes.ok) {
      const ragData = await ragRes.json();
      if (ragData.success && ragData.reply) {
        return ragData.reply;
      }
    }
  } catch (_) {}
  const token = localStorage.getItem('fitness_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // 1. Ưu tiên gọi trực tiếp Ollama fitness-ai-coach vừa được chuẩn hóa Prompt Khoa học
  try {
    const ollamaRes = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'fitness-ai-coach',
        stream: false,
        options: {
          temperature: 0.25,
          repeat_penalty: 1.18,
        },
        messages: [
          {
            role: 'system',
            content:
              'Bạn là FitnessAI Coach - Chuyên gia Khoa học Thể thao và PT cao cấp. QUY TẮC BẮT BUỘC: 1. Trình bày ngắn gọn, khoa học, chia mục bằng ###. 2. Dùng tên bài tập chuẩn phòng Gym song ngữ Việt - Anh (ví dụ: Incline Dumbbell Press - Đẩy ngực trên tạ đơn, Cable Triceps Pushdown - Kéo cáp tay sau). 3. Định lượng rõ: 3 Sets x 10-12 Reps | RPE 8 | Nghỉ 75s. 4. Tuyệt đối KHÔNG lặp lại cùng một câu lưu ý ở từng bài tập.',
          },
          ...historyMessages.slice(-6).map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
          { role: 'user', content: contextualMessage },
        ],
      }),
    });

    if (ollamaRes.ok) {
      const ollamaData = await ollamaRes.json();
      if (ollamaData.message?.content) {
        return ollamaData.message.content;
      }
    }
  } catch (_) {
    // Nếu Ollama trực tiếp bận thì fallback sang Backend API
  }

  // 2. Fallback qua Backend Node.js
  const backendEndpoints = [
    'http://localhost:3000/api/chat',
    'http://localhost:3000/api/ai/chat',
    '/api/chat',
  ];

  for (const endpoint of backendEndpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: contextualMessage,
          prompt: contextualMessage,
          history: historyMessages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply =
          data.reply ||
          data.response ||
          data.message ||
          data.answer ||
          data.data?.reply ||
          data.data?.response;
        if (reply && typeof reply === 'string') return reply;
      }
    } catch (_) {}
  }

  throw new Error('Không thể kết nối tới AI Server');
}

export default function FloatingChatBubble({ currentUser, onApplyWorkoutFromChat }) {
  const activeUserId = getCurrentActiveUserId(currentUser);
  const [sessionOwnerId, setSessionOwnerId] = useState(activeUserId);
  const [sessions, setSessions] = useState(() =>
    loadUserChatSessions(activeUserId, currentUser?.full_name)
  );
  const [activeSessionId, setActiveSessionId] = useState(() => sessions[0]?.id);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Chế độ phóng rộng để đọc giáo án khoa học
  const [viewMode, setViewMode] = useState('chat');
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [pendingSessionIds, setPendingSessionIds] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [appliedMsgIds, setAppliedMsgIds] = useState({});

  const isOpenRef = useRef(isOpen);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeSession) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      const targetSessionId = activeSession.id;
      const now = new Date().toISOString();

      const userImgMsg = {
        id: 'img_' + Date.now(),
        role: 'user',
        content: `📸 Quét dinh dưỡng ảnh món ăn: ${file.name}`,
        imagePreview: base64Data,
        timestamp: now,
      };

      const aiMsgId = 'ai_vision_' + Date.now();
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                title: `📸 Dinh dưỡng: ${file.name.slice(0, 25)}`,
                category: 'nutrition',
                updatedAt: now,
                messages: [
                  ...s.messages,
                  userImgMsg,
                  {
                    id: aiMsgId,
                    role: 'assistant',
                    content: '### 🔍 Đang quét Laser 3D & Bóc tách thành phần món ăn...\n- Đang nhận diện khẩu phần (gram) và đối chiếu bảng `foods` trong PostgreSQL...',
                    timestamp: now,
                  },
                ],
              }
            : s
        )
      );

      setPendingSessionIds((prev) => [...new Set([...prev, targetSessionId])]);

      try {
        const res = await fetch('http://localhost:3000/api/vision-food-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            fileName: file.name,
            userNote: input.trim(),
          }),
        });
        const data = await res.json();
        const replyText = data.reply || '⚠️ Không thể phân tích ảnh lúc này.';

        setSessions((prev) =>
          prev.map((s) =>
            s.id === targetSessionId
              ? {
                  ...s,
                  updatedAt: new Date().toISOString(),
                  messages: s.messages.map((m) =>
                    m.id === aiMsgId ? { ...m, content: replyText } : m
                  ),
                }
              : s
          )
        );

        if (!isOpenRef.current) {
          setUnreadCount((c) => c + 1);
        }
      } catch (err) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === targetSessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === aiMsgId
                      ? { ...m, content: '⚠️ Lỗi kết nối tới máy chủ Vision AI.' }
                      : m
                  ),
                }
              : s
          )
        );
      } finally {
        setPendingSessionIds((prev) => prev.filter((id) => id !== targetSessionId));
      }
    };
    reader.readAsDataURL(file);
  };
  const messagesEndRef = useRef(null);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // TỰ ĐỘNG TÁCH BIỆT LỊCH SỬ TRÒ CHUYỆN KHI ĐĂNG XUẤT / ĐỔI TÀI KHOẢN KHÁC!
  useEffect(() => {
    const currentId = getCurrentActiveUserId(currentUser);
    if (currentId !== sessionOwnerId) {
      const userSessions = loadUserChatSessions(currentId, currentUser?.full_name);
      setSessionOwnerId(currentId);
      setSessions(userSessions);
      setActiveSessionId(userSessions[0]?.id);
      setPendingSessionIds([]);
      setUnreadCount(0);
      setInput('');
      setSearchQuery('');
    }
  }, [activeUserId, currentUser?.id, currentUser?.full_name, sessionOwnerId]);

  // Chỉ lưu lịch sử chat vào đúng ngăn chứa của User ID hiện tại (tránh ghi đè sang tài khoản khác)
  useEffect(() => {
    const currentId = getCurrentActiveUserId(currentUser);
    if (sessionOwnerId && sessionOwnerId === currentId) {
      try {
        localStorage.setItem(
          getUserChatStorageKey(sessionOwnerId),
          JSON.stringify(sessions)
        );
      } catch (_) {}
    }
  }, [sessions, sessionOwnerId, currentUser]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || sessions[0],
    [sessions, activeSessionId]
  );

  useEffect(() => {
    if (isOpen && viewMode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession?.messages?.length, isOpen, viewMode]);

  const isAnyPending = pendingSessionIds.length > 0;
  const isCurrentPending = pendingSessionIds.includes(activeSession?.id);

  const handleNewChat = () => {
    const fresh = createNewSession(currentUser?.full_name);
    setSessions((prev) => [fresh, ...prev]);
    setActiveSessionId(fresh.id);
    setViewMode('chat');
  };

  const handleSendMessage = async (customPrompt) => {
    const text = (customPrompt !== undefined ? customPrompt : input).trim();
    if (!text || !activeSession) return;

    const targetSessionId = activeSession.id;
    const now = new Date().toISOString();
    const userMsg = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: now,
    };

    const currentHistory = activeSession.messages || [];

    if (customPrompt === undefined) {
      setInput('');
    }

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== targetSessionId) return s;
        const isFirstUserMsg = !s.messages.some((m) => m.role === 'user');
        const newTitle = isFirstUserMsg
          ? text.length > 44
            ? text.slice(0, 44) + '...'
            : text
          : s.title;
        return {
          ...s,
          title: newTitle,
          category: isFirstUserMsg ? detectCategory(text) : s.category,
          updatedAt: now,
          messages: [...s.messages, userMsg],
        };
      })
    );

    setPendingSessionIds((prev) => [...new Set([...prev, targetSessionId])]);

    try {
      const aiReplyText = await requestAiCoachReply(text, currentHistory, currentUser);

      // Tự động tạo bộ bài tập điều chỉnh theo thể trạng & chấn thương nếu tin nhắn liên quan đến lịch tập / chấn thương
      let suggestedPlan = null;
      const isWorkoutIntent =
        detectCategory(text) === 'workout' ||
        /tập|bài|lịch|giáo án|đau|chấn thương|mỏi|khớp|lưng|gối|vai|ngực|chân|tay|xô|bụng/i.test(text);

      if (isWorkoutIntent) {
        try {
          const adjRes = await fetch('http://localhost:3000/api/rag-adjust-workout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text,
              aiReply: aiReplyText,
              userProfile: currentUser || {},
            }),
          });
          if (adjRes.ok) {
            const adjData = await adjRes.json();
            if (adjData.success && Array.isArray(adjData.exercises) && adjData.exercises.length > 0) {
              suggestedPlan = {
                exercises: adjData.exercises,
                detectedInjuries: adjData.detectedInjuries || [],
                summaryReason: adjData.summaryReason || '',
              };
            }
          }
        } catch (_) {}
      }

      const replyNow = new Date().toISOString();
      const aiMsg = {
        id: 'ai_' + Date.now(),
        role: 'assistant',
        content: aiReplyText,
        suggestedPlan,
        timestamp: replyNow,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? { ...s, updatedAt: replyNow, messages: [...s.messages, aiMsg] }
            : s
        )
      );

      if (!isOpenRef.current) {
        setUnreadCount((c) => c + 1);
      }
    } catch (_) {
      const errNow = new Date().toISOString();
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                updatedAt: errNow,
                messages: [
                  ...s.messages,
                  {
                    id: 'err_' + Date.now(),
                    role: 'assistant',
                    content:
                      '⚠️ Không kết nối được tới mô hình AI. Hãy đảm bảo Ollama đang chạy.',
                    timestamp: errNow,
                  },
                ],
              }
            : s
        )
      );
    } finally {
      setPendingSessionIds((prev) => prev.filter((id) => id !== targetSessionId));
    }
  };

  const handleApplySuggestedWorkout = async (msg, mode = 'replace') => {
    if (!msg?.suggestedPlan?.exercises || typeof onApplyWorkoutFromChat !== 'function') return;
    const { exercises, detectedInjuries, summaryReason } = msg.suggestedPlan;
    await onApplyWorkoutFromChat(exercises, mode, summaryReason, detectedInjuries);
    setAppliedMsgIds((prev) => ({ ...prev, [msg.id]: mode }));
    const el = document.getElementById('workout-schedule-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const togglePinSession = (sessionId, e) => {
    e.stopPropagation();
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, pinned: !s.pinned } : s))
    );
  };

  const deleteSession = (sessionId, e) => {
    e.stopPropagation();
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== sessionId);
      if (remaining.length === 0) {
        const fresh = createNewSession(currentUser?.full_name);
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleCopy = (id, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sessions
      .filter((s) => {
        if (filterTab === 'pinned' && !s.pinned) return false;
        if (filterTab === 'workout' && s.category !== 'workout') return false;
        if (filterTab === 'nutrition' && s.category !== 'nutrition') return false;
        if (!q) return true;
        const inTitle = s.title.toLowerCase().includes(q);
        const inMessages = s.messages.some((m) =>
          m.content.toLowerCase().includes(q)
        );
        return inTitle || inMessages;
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
  }, [sessions, searchQuery, filterTab]);

  return (
    <>
      {/* KHUNG CHAT BỀN VỮNG (CÓ CHẾ ĐỘ PHÓNG RỘNG ĐỌC GIÁO ÁN KHOA HỌC) */}
      <div
        className={`fixed bottom-24 md:bottom-24 right-4 sm:right-6 z-50 ${
          isExpanded
            ? 'w-[calc(100vw-2rem)] sm:w-[680px] h-[720px] max-h-[84vh]'
            : 'w-[calc(100vw-2rem)] sm:w-[450px] h-[620px] max-h-[78vh]'
        } rounded-3xl bg-slate-950/95 backdrop-blur-xl border-2 border-lime-400/40 shadow-2xl shadow-black/80 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-90 translate-y-8 pointer-events-none'
        }`}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950/80 to-slate-900 px-4 py-3 border-b border-lime-400/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-950 font-black shrink-0 shadow-md shadow-lime-500/20">
              <Dumbbell className="w-5 h-5 stroke-[2.5]" />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                  isAnyPending ? 'bg-orange-400 animate-ping' : 'bg-lime-400'
                }`}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black italic uppercase tracking-wide text-white truncate">
                  AI PT Science Lab
                </h3>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-lime-400/20 text-lime-300 border border-lime-400/40">
                  {currentUser?.full_name ? currentUser.full_name.split(' ').slice(-1)[0] : 'PRO'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {isAnyPending
                  ? '⚡ Đang phân tích cơ sinh học & giáo án...'
                  : activeSession?.title || 'Sẵn sàng tư vấn'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleNewChat}
              title="Tạo cuộc hội thoại mới"
              className="p-2 rounded-xl bg-white/5 hover:bg-lime-400/20 text-slate-200 hover:text-lime-300 border border-white/10 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode((v) => (v === 'history' ? 'chat' : 'history'))
              }
              title="Lịch sử & Truy vấn hội thoại trước"
              className={`relative p-2 rounded-xl border transition-colors cursor-pointer ${
                viewMode === 'history'
                  ? 'bg-lime-400 text-slate-950 border-lime-400 font-bold'
                  : 'bg-white/5 hover:bg-lime-400/20 text-slate-200 hover:text-lime-300 border-white/10'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                {sessions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              title={isExpanded ? 'Thu gọn kích thước' : 'Mở rộng khung đọc giáo án'}
              className="hidden sm:flex p-2 rounded-xl bg-white/5 hover:bg-lime-400/20 text-slate-200 hover:text-lime-300 border border-white/10 transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title="Thu nhỏ xuống bong bóng (Không mất tiến trình)"
              className="p-2 rounded-xl bg-white/5 hover:bg-orange-500/20 text-slate-200 hover:text-orange-300 border border-white/10 transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* CHẾ ĐỘ LỊCH SỬ & TRUY VẤN */}
        {viewMode === 'history' ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-3">
            <div className="flex items-center justify-between mb-2.5">
              <button
                type="button"
                onClick={() => setViewMode('chat')}
                className="inline-flex items-center gap-1 text-xs font-bold text-lime-400 hover:underline cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Quay lại khung chat hiện tại
              </button>
              <span className="text-[11px] text-slate-400 font-semibold">
                Đã lưu {sessions.length} giáo án
              </span>
            </div>

            <div className="relative mb-2.5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm từ khóa (vd: đau vai, ngực, TDEE, calo)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-lime-400 text-xs text-white placeholder-slate-400 outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'pinned', label: '⭐ Đã ghim' },
                { key: 'workout', label: '💪 Lịch tập' },
                { key: 'nutrition', label: '🥗 Dinh dưỡng' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterTab(tab.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    filterTab === tab.key
                      ? 'bg-lime-400 text-slate-950'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Không tìm thấy đoạn hội thoại nào khớp từ khóa.
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const isCurrent = session.id === activeSession?.id;
                  const isPendingThis = pendingSessionIds.includes(session.id);
                  const lastMsg =
                    session.messages[session.messages.length - 1]?.content || '';
                  const matchedMsg = searchQuery.trim()
                    ? session.messages.find((m) =>
                        m.content
                          .toLowerCase()
                          .includes(searchQuery.trim().toLowerCase())
                      )
                    : null;

                  return (
                    <div
                      key={session.id}
                      onClick={() => {
                        setActiveSessionId(session.id);
                        setViewMode('chat');
                      }}
                      className={`group cursor-pointer p-3 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-emerald-950/40 border-lime-400/60'
                          : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <MessageSquare className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                          <h4 className="text-xs font-bold text-white truncate">
                            {session.title}
                          </h4>
                          {isPendingThis && (
                            <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 animate-pulse">
                              Đang trả lời...
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => togglePinSession(session.id, e)}
                            className={`p-1 rounded hover:bg-white/10 ${
                              session.pinned
                                ? 'text-amber-400'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <Star
                              className="w-3.5 h-3.5"
                              fill={session.pinned ? 'currentColor' : 'none'}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => deleteSession(session.id, e)}
                            className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-1.5">
                        {matchedMsg
                          ? `🔍 Khớp: "${matchedMsg.content.replace(/[#*]/g, '').slice(0, 110)}..."`
                          : lastMsg.replace(/[#*]/g, '').slice(0, 100)}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{session.messages.length} tin nhắn</span>
                        <span>
                          {new Date(session.updatedAt).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* CHẾ ĐỘ KHUNG CHAT KHOA HỌC */
          <>
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-slate-950">
              {activeSession?.messages?.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`relative ${
                        isUser
                          ? 'max-w-[82%] bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 font-bold rounded-2xl rounded-br-sm px-4 py-2.5 text-xs shadow-md'
                          : 'w-full bg-slate-900/95 text-slate-100 border border-slate-800 rounded-2xl rounded-bl-sm p-3.5 shadow-lg'
                      }`}
                    >
                      {isUser ? (
                        <div className="space-y-2">
                          {msg.imagePreview && (
                            <div className="relative rounded-xl overflow-hidden border-2 border-slate-950/30 max-h-48">
                              <img
                                src={msg.imagePreview}
                                alt="Food preview"
                                className="w-full h-40 object-cover"
                              />
                              <div className="ai-scanline" />
                            </div>
                          )}
                          <div className="whitespace-pre-wrap break-words">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <>
                          <ScientificMessageRenderer content={msg.content} />

                          {msg.suggestedPlan?.exercises?.length > 0 && (
                            <div className="mt-3 p-3 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border border-lime-400/40 shadow-lg space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-black uppercase tracking-wide text-lime-300 flex items-center gap-1.5">
                                  <Zap className="w-3.5 h-3.5 text-lime-400" />
                                  Giáo Án Điều Chỉnh Tự Động ({msg.suggestedPlan.exercises.length} bài)
                                </span>
                                {msg.suggestedPlan.detectedInjuries?.length > 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold">
                                    🛡️ An toàn: {msg.suggestedPlan.detectedInjuries.join(', ')}
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                {msg.suggestedPlan.exercises.map((ex, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px]"
                                  >
                                    <span className="font-bold text-white truncate">
                                      {idx + 1}. {ex.name}
                                    </span>
                                    <span className="shrink-0 font-mono font-bold text-emerald-400 text-[10px]">
                                      {ex.target_sets}x{ex.target_reps} • RPE {ex.target_rpe}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {appliedMsgIds[msg.id] ? (
                                <div className="py-2 px-3 rounded-xl bg-lime-400/20 border border-lime-400 text-lime-300 text-xs font-black flex items-center justify-center gap-1.5">
                                  <Check className="w-4 h-4" />
                                  Đã cập nhật vào Danh Sách Bài Tập trên Dashboard & Lưu Database!
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-2 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleApplySuggestedWorkout(msg, 'replace')}
                                    className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1 shadow-md shadow-lime-500/20 cursor-pointer transition-all"
                                  >
                                    <Zap className="w-3.5 h-3.5" /> Thay Thế Lịch Hôm Nay
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApplySuggestedWorkout(msg, 'append')}
                                    className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> Cộng Thêm Vào Lịch
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {!isUser && (
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10 text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-400">
                            Trợ lý Thể thao & Dinh dưỡng
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 hover:text-lime-400 cursor-pointer transition-colors"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-lime-400" /> Đã chép giáo án
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Sao chép
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {activeSession?.messages?.length <= 1 && !isCurrentPending && (
                <div className="pt-1">
                  <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-lime-400" /> Chủ đề gợi ý:
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {QUICK_PROMPTS.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(q)}
                        className="text-left text-xs px-3 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-lime-300 border border-slate-800 hover:border-lime-400/40 transition-all cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isCurrentPending && (
                <div className="flex justify-start">
                  <div className="w-full rounded-2xl bg-slate-900 border border-lime-400/30 p-3.5 text-xs text-lime-300 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-lime-400 shrink-0" />
                    <div>
                      <div className="font-bold">
                        AI đang tính toán khối lượng tập (Volume) & RPE...
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Bạn có thể bấm Thu nhỏ (—) để xem lịch tập bên ngoài mà không mất tiến trình.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2 shrink-0"
            >
                            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Chụp / Tải ảnh món ăn để AI tính Calo & Macro"
                className="p-2.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/30 text-orange-400 border border-orange-500/40 transition-colors cursor-pointer shrink-0"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập mục tiêu, nhóm cơ, tình trạng chấn thương..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-lime-400 text-xs text-white placeholder-slate-400 outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-400 disabled:opacity-40 text-slate-950 font-black hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          </>
        )}
      </div>

      {/* BONG BÓNG CHAT NỔI */}
      <div className="fixed bottom-20 md:bottom-6 right-5 z-50 flex items-center gap-3 group">
        {isAnyPending && !isOpen ? (
          <div
            onClick={() => setIsOpen(true)}
            className="cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/95 text-orange-300 border border-orange-500/50 shadow-xl animate-pulse"
          >
            <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
            <span className="text-xs font-black italic uppercase tracking-wide">
              AI PT đang soạn giáo án... (Bấm để mở)
            </span>
          </div>
        ) : unreadCount > 0 && !isOpen ? (
          <div
            onClick={() => setIsOpen(true)}
            className="cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/95 text-lime-300 border border-lime-400 shadow-xl animate-bounce"
          >
            <Zap className="w-4 h-4 text-lime-400 fill-lime-400" />
            <span className="text-xs font-black italic uppercase tracking-wide">
              ✅ Giáo án đã sẵn sàng! ({unreadCount})
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/95 text-white border border-lime-400/40 shadow-xl opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none">
            <Zap className="w-4 h-4 text-lime-400 fill-lime-400" />
            <span className="text-xs font-black italic uppercase tracking-wide">
              {isOpen ? 'Thu nhỏ khung chat' : 'HLV Khoa Học Thể Thao AI'}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Mở hoặc thu nhỏ Trợ lý HLV AI"
          className={`cursor-pointer relative flex items-center justify-center w-16 h-16 rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 border-2 ${
            isAnyPending
              ? 'bg-gradient-to-br from-orange-400 via-amber-400 to-lime-400 text-slate-950 shadow-orange-500/40 border-white'
              : 'bg-gradient-to-br from-lime-400 via-emerald-400 to-teal-500 text-slate-950 shadow-lime-500/40 border-white/30'
          }`}
        >
          <span
            className={`pointer-events-none absolute inset-0 rounded-2xl border-2 animate-ping opacity-30 ${
              isAnyPending ? 'border-orange-400' : 'border-lime-400'
            }`}
          />

          <div className="pointer-events-none flex flex-col items-center justify-center leading-none">
            {isAnyPending ? (
              <Loader2 className="w-6 h-6 stroke-[2.6] mb-0.5 animate-spin" />
            ) : (
              <Dumbbell className="w-6 h-6 stroke-[2.6] mb-0.5 -rotate-12 group-hover:rotate-0 transition-transform" />
            )}
            <span className="text-[10px] font-black italic tracking-tighter uppercase">
              {isOpen ? 'THU NHỎ' : 'AI PT'}
            </span>
          </div>

          {unreadCount > 0 && !isOpen ? (
            <span className="pointer-events-none absolute -top-2 -right-2 px-1.5 min-w-[22px] h-5 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center justify-center border-2 border-slate-950 shadow-lg">
              {unreadCount}
            </span>
          ) : (
            <span className="pointer-events-none absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 border-2 border-slate-950"></span>
            </span>
          )}
        </button>
      </div>
    </>
  );
}