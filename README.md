# Fitness AI Platform

> **Hệ thống Quản lý Lịch tập Gym, Dinh dưỡng và Huấn luyện viên ảo Ứng dụng Trí tuệ Nhân tạo**

[![Node.js](https://img.shields.io/badge/Node.js-v20-green?logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-v5-black?logo=express)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v19-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v8-purple?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-white?logo=ollama)](https://ollama.ai/)
[![Gemini](https://img.shields.io/badge/Gemini_1.5_Flash-Cloud_AI-orange?logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-brightgreen)](LICENSE)

---

## 📌 Giới thiệu tổng quan

**Fitness AI Platform** là nền tảng quản lý tập luyện kháng lực, theo dõi chế độ dinh dưỡng cá nhân hóa và đồng hành cùng hội viên thông qua huấn luyện viên ảo ứng dụng trí tuệ nhân tạo đa phương thức. 

Hệ thống giải quyết các thách thức phổ biến trong rèn luyện thể hình thực tế:
- **Nguy cơ chấn thương do tập sai kỹ thuật hoặc chọn bài tập chống chỉ định**: Tích hợp bộ quy tắc cơ sinh học tự động lọc bỏ các bài tập gây hại lên cột sống thắt lưng, khớp vai hoặc khớp gối theo tiền sử chấn thương của từng hội viên.
- **Tính toán năng lượng thiếu căn cứ khoa học**: Áp dụng công thức y học Mifflin-St Jeor xác định chỉ số trao đổi chất cơ bản (BMR), nhân hệ số vận động thể chất (TDEE) và phân bổ tỷ lệ Macronutrients chuẩn hóa theo mục tiêu tăng cơ hoặc giảm mỡ.
- **Thực đơn thiếu gần gũi với ẩm thực Việt Nam**: Module thị giác máy tính nhận diện ảnh món ăn Việt Nam truyền thống và ước tính chính xác calo, chất đạm, tinh bột, chất béo.
- **Khoảng cách giao tiếp giữa hội viên và huấn luyện viên cá nhân (PT)**: Thiết lập mô hình Human-in-the-Loop, cho phép PT trực tiếp xem xét, tinh chỉnh và phê duyệt giáo án do AI khởi tạo, đồng thời quản lý lịch hẹn 60 phút và điểm danh bằng mã QR.

---

## 🏗️ Kiến trúc hệ thống bốn tầng

Hệ thống được thiết kế theo mô hình kiến trúc phân tầng chuyên biệt, đảm bảo tính mở rộng và bảo mật cao:

```text
+-----------------------------------------------------------------------------------+
|  TẦNG GIAO DIỆN NGƯỜI DÙNG (FRONTEND: REACT 19 + VITE + TAILWIND CSS 4)           |
|  - Member Portal: Bảng điều khiển thể trạng, phân tích calo & Studio tạo giáo án  |
|  - Smart Food Vision: Chụp ảnh nhận diện món ăn Việt Nam & tính Macros tức thì   |
|  - RAG Assistant Chat: Trợ lý ảo hỏi đáp bài tập & kỹ thuật nâng tạ               |
|  - PT Workspace: Duyệt giáo án tập luyện, xếp ca dạy & quét mã QR điểm danh      |
|  - Admin Dashboard: Quản lý người dùng, phân quyền RBAC & thống kê gói dịch vụ    |
+-----------------------------------------------------------------------------------+
                                         |
                                  HTTP / RESTful JSON
                                         v
+-----------------------------------------------------------------------------------+
|  TẦNG MÁY CHỦ ỨNG DỤNG (BACKEND: NODE.JS + EXPRESS 5 RESTFUL API)                 |
|  - Xác thực & Phân quyền: JSON Web Token (JWT) + RBAC (Member, PT, Admin)         |
|  - Biomechanical Engine: Bộ quy tắc loại trừ bài tập nguy hiểm theo chấn thương   |
|  - Nutrition Calculator: Bộ giải thuật Mifflin-St Jeor & phân bổ Macronutrients   |
|  - Smart Food Vision Controller: Cổng lọc rác ảnh & điều phối phân tích thị giác  |
|  - RAG Chat Controller: Cơ chế tăng cường ngữ cảnh truy xuất từ cơ sở dữ liệu     |
|  - Booking & QR Engine: Quản lý ca tập 60 phút với thời gian đệm 15 phút          |
+-----------------------------------------------------------------------------------+
                        |                                       |
                   pg Connection Pool                     REST / SDK
                        v                                       v
+----------------------------------+ +----------------------------------------------+
| TẦNG LƯU TRỮ DỮ LIỆU             | | TẦNG SUY LUẬN TRÍ TUỆ NHÂN TẠO HYBRID        |
| - PostgreSQL Database (19 bảng)  | | - Mô hình cục bộ (Ollama):                  |
| - Quan hệ chuẩn hóa 3NF          | |   + Qwen2.5-7B-Instruct                      |
| - Khóa ngoại toàn vẹn dữ liệu    | |   + Qwen2-VL-7B fine-tuned LoRA Adapter      |
| - Lưu trữ bài tập, calo, lịch hẹn| | - API dự phòng đám mây: Gemini 1.5 Flash    |
+----------------------------------+ +----------------------------------------------+
```

---

## ✨ Các tính năng cốt lõi

### 1. Tự động sinh giáo án kháng lực bốn pha khoa học
Giáo án thể hình không áp đặt một công thức cố định mà phân bổ theo cấu trúc 4 pha bài bản:
- **Pha 1: Primary Compound** — Bài tập đa khớp nền tảng (Squat, Deadlift, Bench Press...), kích hoạt tối đa đơn vị vận động cơ bắp (4 hiệp x 6 - 8 lần lặp, RPE 8.0).
- **Pha 2: Secondary Assistance** — Bài tập bổ trợ phát triển nhóm cơ mục tiêu ở các góc chuyển động đa dạng (3 hiệp x 8 - 10 lần lặp, RPE 8.0).
- **Pha 3: Isolation / Finisher** — Cô lập một khớp chuyển động duy nhất, tăng áp lực chuyển hóa mà không gây tải nặng lên cột sống (3 hiệp x 12 - 15 lần lặp, RPE 8.5 - 9.0).
- **Pha 4: Core / Cool-down** — Tăng cường nhóm cơ lõi bảo vệ thắt lưng và điều hòa nhịp tim cuối buổi (2 - 3 hiệp x 15 - 20 lần lặp, RPE 7.0 - 7.5).

### 2. Bộ lọc an toàn cơ sinh học chống chỉ định chấn thương
Khi hội viên khai báo tiền sử chấn thương, hệ thống tự động khóa các bài tập nguy hiểm và thay thế bằng bài tập an toàn:
- **Chấn thương cột sống thắt lưng / Thoát vị đĩa đệm**: Tự động loại bỏ *Barbell Back Squat, Conventional Deadlift, Standing Overhead Press*; chuyển sang bài tập có điểm tựa ngực như *Chest-Supported Dumbbell Row, Lat Pulldown, Goblet Squat*.
- **Chấn thương khớp vai / Chóp xoay**: Khóa các bài đẩy tạ sau gáy hoặc dạng vai 90 độ; thay thế bằng *Dumbbell Floor Press* trên mặt sàn phẳng hoặc tư thế cầm tạ trung tính (*Neutral-Grip Press*).
- **Chấn thương khớp gối / Hội chứng bánh chè đùi**: Hạn chế gập gối quá 90 độ dưới tải trọng nặng; ưu tiên *Romanian Deadlift, Glute Bridge* để tập trung vào chuỗi cơ sau.

### 3. Phân bổ dinh dưỡng và calo cá nhân hóa
- Tính chỉ số trao đổi chất cơ bản theo công thức **Mifflin-St Jeor**:
  $$\text{BMR}_{\text{Nam}} = 10 \times m + 6.25 \times h - 5 \times a + 5$$
  $$\text{BMR}_{\text{Nữ}} = 10 \times m + 6.25 \times h - 5 \times a - 161$$
- Nhân hệ số hoạt động thể chất $PAL \in [1.2, 1.725]$ để ra tổng mức tiêu hao năng lượng mỗi ngày (TDEE).
- Phân bổ tỷ lệ Macronutrients: Protein (2.0 - 2.2 g/kg trọng lượng cơ thể), Fat (20 - 25% tổng năng lượng calo), Carb bù đắp toàn bộ năng lượng còn lại.

### 4. Nhận diện món ăn Việt Nam qua thị giác máy tính
- Kiểm tra tính hợp lệ bằng bộ gác cổng thị giác để loại bỏ các ảnh không liên quan (xe cộ, phong cảnh, ảnh selfie).
- Trích xuất tự động tên món ăn Việt Nam (cơm tấm sườn, phở bò, bún bò Huế, trứng luộc, ức gà áp chảo, cá kho tộ...) và tra cứu tức thì lượng calo, chất đạm, tinh bột, chất béo vào nhật ký ăn uống.

### 5. Huấn luyện viên cá nhân duyệt giáo án & Điểm danh mã QR
- Áp dụng nguyên tắc Human-in-the-Loop: Giáo án do AI đề xuất phải được PT xem xét, phê duyệt hoặc sửa đổi trước khi kích hoạt chính thức cho hội viên.
- Cơ chế chống xung đột lịch hẹn: Mỗi ca huấn luyện kéo dài 60 phút, hệ thống tự động chèn khoảng đệm 15 phút trước khi cho phép đặt ca kế tiếp.
- Check-in tự động: Sinh mã QR động cho từng buổi tập, PT quét mã trực tiếp trên giao diện để cập nhật trạng thái hoàn thành và trừ số buổi trong gói tập.

---

## 📁 Cấu trúc thư mục dự án

```text
du-an-lich-tap-gym-va-fitness/
├── README.md                           # Tài liệu giới thiệu tổng quan dự án
├── .gitignore                          # Cấu hình bỏ qua tệp nhị phân và dữ liệu cục bộ
├── Modelfile.vision                    # Cấu hình đóng gói mô hình thị giác Ollama
│
├── fitness-ai-backend/                 # Phân hệ máy chủ Express RESTful API
│   ├── config/                         # Kết nối cơ sở dữ liệu PostgreSQL
│   │   └── db.js                       # Cấu hình pg Connection Pool
│   ├── controllers/                    # Điều phối nghiệp vụ chức năng
│   │   ├── authCtrl.js                 # Xác thực người dùng và cấp phát mã JWT
│   │   ├── bookingCtrl.js              # Đặt lịch hẹn PT và kiểm tra khoảng nghỉ 15 phút
│   │   ├── ptCtrl.js                   # Quản lý ca dạy và phê duyệt giáo án
│   │   ├── smartFoodVisionCtrl.js      # Phân tích ảnh món ăn và gọi mô hình VLM
│   │   ├── ragChatCtrl.js              # Trợ lý ảo RAG tra cứu tri thức tập luyện
│   │   └── workoutCtrl.js              # Giải thuật tạo giáo án kháng lực 4 pha
│   ├── middleware/                     # Kiểm tra chữ ký JWT và ma trận phân quyền RBAC
│   ├── routes/                         # Khai báo các điểm cuối REST API
│   ├── scripts/                        # Kịch bản khởi tạo và nạp dữ liệu cơ sở dữ liệu
│   │   ├── initDb.js                   # DDL khởi tạo cấu trúc 19 bảng quan hệ
│   │   ├── seedEnrichedExercises.js    # Nạp danh mục bài tập kháng lực chuẩn hóa
│   │   └── seedEnrichedData.js         # Nạp người dùng, gói tập, thực đơn dinh dưỡng mẫu
│   ├── services/                       # Dịch vụ tính toán BMR/TDEE và giao tiếp AI
│   │   ├── aiService.js                # Bộ quy tắc cơ sinh học loại bỏ bài tập chấn thương
│   │   ├── llmService.js               # Kết nối Ollama cục bộ và Gemini Flash API
│   │   └── nutritionService.js         # Tính toán nhu cầu calo và phân bổ Macronutrients
│   └── server.js                       # Điểm khởi chạy máy chủ Node.js
│
├── fitness-ai-frontend/                # Phân hệ giao diện người dùng React 19 + Vite
│   ├── src/
│   │   ├── components/                 # Các thành phần giao diện tái sử dụng
│   │   │   ├── AudioCoachBar.jsx       # Thanh phát âm giọng nói hướng dẫn tập luyện
│   │   │   ├── BookingModal.jsx        # Hộp thoại đặt lịch tập kèm mã QR
│   │   │   ├── WorkoutStudioGenerator.jsx # Công cụ tạo giáo án tương tác
│   │   │   └── dashboard/              # Các thành phần giao diện Bảng điều khiển
│   │   ├── pages/                      # Các trang ứng dụng chính
│   │   │   ├── Dashboard.jsx           # Bảng điều khiển trung tâm của hội viên
│   │   │   ├── Onboarding.jsx          # Khảo sát thể trạng, mục tiêu và tiền sử bệnh lý
│   │   │   ├── PtWorkspace.jsx         # Không gian làm việc quản lý hội viên của PT
│   │   │   └── AdminDashboard.jsx      # Bảng điều khiển quản trị viên hệ thống
│   │   └── services/                   # Module giao tiếp HTTP Axios với máy chủ
│   └── vite.config.js                  # Cấu hình đóng gói Vite và Tailwind CSS 4
│
├── models/                             # Cấu hình bộ điều hợp mô hình trí tuệ nhân tạo
│   └── fitness_vision_food_lora/       # Bộ điều hợp LoRA tinh chỉnh cho Qwen2-VL-7B
│       ├── adapter_config.json         # Siêu tham số huấn luyện LoRA (Rank 16, Alpha 32)
│       ├── tokenizer_config.json       # Cấu hình bộ tách từ vựng
│       └── README.md                   # Báo cáo đánh giá thực nghiệm mô hình
│
└── Template Latex/Template_latex-Report/ # Toàn bộ báo cáo học thuật chuyên sâu
    ├── compile.bat                     # Tệp lệnh tự động biên dịch báo cáo sang PDF
    ├── main.tex                        # Tệp nguồn chính liên kết toàn bộ tài liệu
    ├── config/                         # Cấu hình phông chữ tiếng Việt, gói lệnh, định dạng
    ├── frontmatter/                    # Trang bìa, lời cam đoan, tóm tắt, danh mục thuật ngữ
    ├── chapters/                       # 5 chương nội dung học thuật chuẩn mực
    ├── appendices/                     # Phụ lục mã nguồn, cấu trúc thư mục, siêu tham số
    └── references.bib                  # Danh mục tài liệu tham khảo chuẩn IEEE
```

---

## 🛠️ Yêu cầu môi trường

Để cài đặt và vận hành hệ thống, máy tính cần đáp ứng các yêu cầu sau:

- **Node.js**: Phiên bản `>= 18.0.0` (khuyến nghị phiên bản 20 LTS)
- **PostgreSQL**: Phiên bản `>= 14.0` (khuyến nghị phiên bản 16)
- **Ollama** (Tùy chọn khi chạy mô hình AI cục bộ): Hỗ trợ chạy các mô hình `qwen2.5:7b` hoặc `qwen2-vl:7b`
- **MiKTeX / XeLaTeX** (Tùy chọn khi muốn biên dịch lại tệp báo cáo PDF): Cài đặt đầy đủ gói tiếng Việt và `biber` / `bibtex`

---

## 🚀 Hướng dẫn cài đặt và khởi chạy

### Bước 1: Sao chép kho mã nguồn
```bash
git clone https://github.com/Haibeotn/Gym-Fitness.git
cd Gym-Fitness
```

### Bước 2: Thiết lập cơ sở dữ liệu PostgreSQL
1. Mở công cụ quản trị PostgreSQL (ví dụ pgAdmin hoặc psql) và tạo cơ sở dữ liệu mới mang tên `fitness_db`:
   ```sql
   CREATE DATABASE fitness_db;
   ```
2. Chuyển vào thư mục `fitness-ai-backend`, tạo tệp `.env` dựa trên bản mẫu `.env.example`:
   ```bash
   cd fitness-ai-backend
   cp .env.example .env
   ```
3. Cập nhật thông tin tài khoản cơ sở dữ liệu và khóa API của bạn trong tệp `.env`:
   ```env
   PORT=3000
   DB_USER=postgres
   DB_PASSWORD=mat_khau_cua_ban
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=fitness_db
   GEMINI_API_KEY=khoa_api_gemini_cua_ban
   OLLAMA_MODEL=fitness-ai-coach
   OLLAMA_BASE_URL=http://localhost:11434
   ```
4. Chạy kịch bản khởi tạo cấu trúc bảng và nạp dữ liệu mẫu ban đầu:
   ```bash
   node scripts/initDb.js
   node scripts/seedEnrichedExercises.js
   node scripts/seedEnrichedData.js
   ```

### Bước 3: Khởi chạy máy chủ Backend API
Trong thư mục `fitness-ai-backend`:
```bash
npm install
npm start
```
Máy chủ dịch vụ sẽ lắng nghe tại địa chỉ: `http://localhost:3000`.

### Bước 4: Khởi chạy giao diện người dùng Frontend
Mở một cửa sổ dòng lệnh mới và chuyển vào thư mục `fitness-ai-frontend`:
```bash
cd fitness-ai-frontend
npm install
npm run dev
```
Giao diện ứng dụng web sẽ khởi động tại: `http://localhost:5173`.

---

## 🤖 Thiết lập mô hình Trí tuệ Nhân tạo cục bộ (Tùy chọn)

Nếu bạn muốn ứng dụng hoạt động hoàn toàn ngoại tuyến không phụ thuộc vào kết nối đám mây:

1. Tải và cài đặt nền tảng [Ollama](https://ollama.ai/).
2. Kéo mô hình ngôn ngữ nền tảng về máy:
   ```bash
   ollama pull qwen2.5:7b
   ```
3. Khởi tạo mô hình chuyên sâu bằng tệp cấu hình đính kèm:
   ```bash
   ollama create fitness-ai-coach -f Modelfile.vision
   ```
4. Kiểm tra dịch vụ Ollama đang hoạt động tại cổng mặc định `http://localhost:11434`.

---

## 📑 Biên dịch Báo cáo Đồ án Học thuật (LaTeX)

Thư mục `Template Latex/Template_latex-Report/` chứa toàn bộ bản thảo báo cáo đồ án tốt nghiệp học thuật được định dạng chuẩn mực theo quy cách của các trường đại học công nghệ:

- **Công cụ biên dịch**: Sử dụng trình biên dịch **XeLaTeX** để hiển thị bảng mã Unicode tiếng Việt và các sơ đồ đồ họa vẽ bằng TikZ.
- **Biên dịch một cú nhấp chuột (trên Windows)**:
  Chỉ cần mở thư mục `Template Latex/Template_latex-Report/` và bấm đúp vào tệp:
  ```text
  compile.bat
  ```
  Tệp lệnh tự động chạy quy trình biên dịch 4 lượt (`XeLaTeX` -> `BibTeX` -> `XeLaTeX` -> `XeLaTeX`) và tự động mở tệp `main.pdf` hoàn thiện.

---

## 📊 Kết quả đánh giá thực nghiệm mô hình AI

| Nhiệm vụ đánh giá | Số lượng mẫu kiểm thử | Tỷ lệ chính xác | Đánh giá kỹ thuật |
| :--- | :---: | :---: | :--- |
| **Phân loại cổng vào ảnh món ăn** | 120 ảnh | 95.8% | Từ chối chuẩn xác các ảnh rác không thuộc đồ ăn hoặc thiết bị thể hình |
| **Nhận diện món ăn Việt Nam** | 100 ảnh | 91.0% | Nhận diện xuất sắc phở bò, cơm tấm sườn, ức gà, trứng luộc, canh rau |
| **Bộ lọc loại trừ chấn thương** | 80 hồ sơ | 100.0% | Tuyệt đối không để lọt bài tập chống chỉ định vào giáo án hội viên |
| **Truy vấn tri thức thể hình RAG** | 150 câu hỏi | 93.3% | Phản hồi đúng trọng tâm khoa học, không phát sinh ảo giác |

---

## 👥 Tác giả & Thông tin liên hệ

- **Đơn vị đào tạo**: Trường Đại học Công nghệ Thông tin và Truyền thông (ICTU)
- **Tác giả dự án**: Hải Nguyễn Hoàng (`dtc245220009@ictu.edu.vn`)
- **Kho lưu trữ GitHub**: [Haibeotn/Gym-Fitness](https://github.com/Haibeotn/Gym-Fitness)

---

## 📜 Giấy phép phát hành

Dự án được phân phối dưới giấy phép **MIT License**. Chi tiết vui lòng xem tại tệp `LICENSE`.
