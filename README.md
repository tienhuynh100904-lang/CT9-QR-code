# Giải mã Mã QR — web tĩnh tương tác

Trang web một trang trình bày toàn bộ nội dung tài liệu [`doc/Kien_thuc_ma_QR.docx`](doc/Kien_thuc_ma_QR.docx)
(15 chương: lịch sử, cấu trúc, phiên bản, chế độ mã hóa, Reed–Solomon, mặt nạ, quy trình tạo/đọc, biến thể,
ứng dụng, bảo mật, thiết kế, lập trình, so sánh, hỏi đáp, thuật ngữ) kèm các thí nghiệm tương tác:

- **Phòng thí nghiệm 9 bước** (chương 7): nhập chữ bất kỳ và xem từng bước tạo mã QR — phân tích ký tự,
  chọn phiên bản, chuỗi bit, phép chia đa thức Reed–Solomon, đan xen, mẫu chức năng, xếp bit zíc-zắc,
  chấm điểm 8 mặt nạ, ghi thông tin định dạng; tải PNG/SVG.
- **Thử phá hỏng mã QR** (chương 5): tô bẩn, xóa, chèn logo và xem bộ giải mã thật (jsQR) có còn đọc được.
- Giải phẫu mã phiên bản 7, thanh trượt 40 phiên bản, máy quét bằng ảnh/camera, bộ tạo mã Wi-Fi/vCard/…,
  trò chơi phát hiện lừa đảo, thử độ tương phản màu, bài đố cuối.

Bộ mã hóa QR được viết riêng trong [`lib/qr/`](lib/qr/) để hiển thị được mọi bước trung gian; nó đã được đối
chiếu từng module với thư viện `qrcode` và giải mã lại bằng `jsQR`.

## Chạy và xuất bản

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # xuất web tĩnh vào thư mục out/
```

Thư mục `out/` chỉ gồm HTML/CSS/JS, có thể đưa lên bất kỳ máy chủ tĩnh nào (Nginx, GitHub Pages, Netlify…).
Tính năng quét bằng camera cần trang được phục vụ qua HTTPS (hoặc `localhost`).
