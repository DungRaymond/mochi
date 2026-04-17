import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { execa } from 'execa'; // Sử dụng Execa
import path from 'path';
import fs from 'fs';

// CẤU HÌNH ĐƯỜNG DẪN
const EXTERNAL_BASE_PATH = '/home/user/mochi_data'; // Đổi 'user' thành username của bạn
const KEY_FILE_PATH = path.join(process.cwd(), 'service-account.json');

export async function POST(req) {
  try {
    const { customerName, folderName, fileName } = await req.json();

    const rawPath = path.join(EXTERNAL_BASE_PATH, 'raw', fileName);
    const processedPath = path.join(EXTERNAL_BASE_PATH, 'processed', fileName);
    const overlayPath = path.join(process.cwd(), 'public/assets/frame.png');

    // Đảm bảo thư mục tồn tại
    [path.join(EXTERNAL_BASE_PATH, 'raw'), path.join(EXTERNAL_BASE_PATH, 'processed')].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    // --- BƯỚC 1: GIẢI PHÓNG VÀ CHỤP ẢNH (GPHOTO2) ---
    try {
      // killall gvfs để tránh "Device Busy"
      await execa('killall', ['gvfs-gphoto2-volume-monitor'], { reject: false });

      // Lệnh chụp bằng Execa (viết theo mảng tham số cho an toàn)
      await execa('gphoto2', [
        '--capture-image-and-download',
        '--filename', rawPath
      ]);
    } catch (err) {
      console.error("Gphoto2 Error:", err.stderr);
      return NextResponse.json({ success: false, error: "Máy ảnh chưa sẵn sàng" }, { status: 500 });
    }

    // --- BƯỚC 2: XỬ LÝ MÀU FILM RETRO VINTAGE (IMAGEMAGICK) ---
    try {
      await execa('magick', [
        rawPath,
        '-resize', '1200x',
        '-sepia-tone', '60%',
        '-modulate', '100,70',
        '-contrast-stretch', '2%x2%',
        '-attenuate', '0.4',
        '+noise', 'Gaussian',
        overlayPath,
        '-composite',
        processedPath
      ]);
    } catch (err) {
      console.error("ImageMagick Error:", err.stderr);
      // Nếu lỗi thì copy ảnh gốc qua để không làm đứng web
      fs.copyFileSync(rawPath, processedPath);
    }

    // --- BƯỚC 3: UPLOAD DRIVE NGẦM ---
    // Chúng ta không đợi upload để frontend nhận kết quả sớm
    uploadTask(customerName, folderName, fileName, processedPath);

    return NextResponse.json({ 
      success: true, 
      fileName: fileName,
      message: "Success"
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Hàm upload tách riêng (Background Task)
async function uploadTask(customerName, folderName, fileName, filePath) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE_PATH,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    const drive = google.drive({ version: 'v3', auth });

    // Tìm hoặc tạo Folder
    let folderId;
    const res = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
    });

    if (res.data.files.length > 0) {
      folderId = res.data.files[0].id;
    } else {
      const folder = await drive.files.create({
        resource: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
        fields: 'id',
      });
      folderId = folder.data.id;
    }

    // Upload file
    await drive.files.create({
      resource: { name: fileName, parents: [folderId] },
      media: { mimeType: 'image/jpeg', body: fs.createReadStream(filePath) },
    });
  } catch (e) {
    console.error("Drive Sync Error:", e);
  }
}