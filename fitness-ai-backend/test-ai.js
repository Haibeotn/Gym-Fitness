require('dotenv').config();

async function listAvailableModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
            console.error("Lỗi từ Google API:", data.error.message);
            return;
        }

        console.log("=== DANH SÁCH CÁC MODEL KHẢ DỤNG CHO KEY CỦA BẠN ===");
        const generateModels = data.models?.filter(m =>
            m.supportedGenerationMethods?.includes("generateContent")
        );

        generateModels?.forEach(m => {
            console.log("-", m.name.replace("models/", ""));
        });
    } catch (err) {
        console.error("Lỗi kết nối:", err.message);
    }
}

listAvailableModels();