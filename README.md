# Project SEM3 — Hướng dẫn cài đặt và chạy dự án

## Tổng quan

- **Backend:** NestJS + MongoDB, chạy tại `http://localhost:3000`
- **Frontend:** Angular, chạy tại `http://localhost:4200`

---

## Yêu cầu cài đặt trước (chỉ cần làm 1 lần)

1. **Node.js** v18 trở lên — tải tại https://nodejs.org
2. **MongoDB Community Server** — tải tại https://www.mongodb.com/try/download/community, cài xong start service
3. **Angular CLI:**
   ```cmd
   npm install -g @angular/cli
   ```

---

## Chạy Backend

```cmd
cd backend
npm install
npm run start:dev
```

Backend chạy tại: `http://localhost:3000`

---

## Chạy Frontend

Mở terminal mới:

```cmd
cd frontend
npm install
ng serve
```

Frontend chạy tại: `http://localhost:4200`

---

## Tài khoản mặc định

Tự động tạo khi Backend khởi động lần đầu:

| Role       | Email                 | Password   |
|------------|-----------------------|------------|
| Admin      | admin@gmail.com       | 1234567890 |
| Superadmin | superadmin@gmail.com  | 1234567890 |

---

## Cấu hình môi trường (backend/.env)

File `.env` đã có sẵn trong thư mục `backend/`, không cần tạo lại.

Nếu muốn dùng email riêng để gửi OTP, sửa các dòng sau trong `backend/.env`:

```env
MAIL_USERNAME="your_email@gmail.com"
MAIL_PASSWORD="your_app_password"
MAIL_FROM_ADDRESS="your_email@gmail.com"
```

> Gmail cần dùng **App Password** (không phải mật khẩu thường). Vào Google Account > Security > 2-Step Verification > App passwords để tạo.

---

## Lưu ý

- Phải **start MongoDB trước** khi chạy Backend.
- Phải **chạy Backend trước** khi dùng Frontend (Frontend gọi API tới `http://127.0.0.1:3000`).
- Đăng ký tài khoản mới yêu cầu gửi OTP qua email — nếu không có internet hoặc chưa cấu hình email, dùng tài khoản admin/superadmin có sẵn.
- Không cần cài thêm thư viện thủ công, `npm install` sẽ tự tải toàn bộ dependencies.
