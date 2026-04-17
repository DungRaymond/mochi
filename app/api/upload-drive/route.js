import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);

// --- CẤU HÌNH ĐƯỜNG DẪN ---
// Thay 'user' bằng tên user Linux của bạn (Check bằng lệnh whoami)
const EXTERNAL_BASE_PATH = '/home/user/mochi_data'; 
const KEY_FILE_PATH = path.join(process.cwd(), 'service-account.json');

export async function POST(req) {
  try {
    const { customerName, folderName, fileName } = await req.json();

    // 1. CHUẨN BỊ ĐƯỜNG DẪN LOCAL
    const rawDir = path.join(EXTERNAL_BASE_PATH, 'raw');
    const processedDir = path.join(EXTERNAL_BASE_PATH, 'processed');
    
    // Tự động tạo thư mục nếu chưa có
    [rawDir, processedDir].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    const rawPath = path.join(rawDir, fileName);
    const processedPath = path.join(processedDir, fileName);
    const overlayPath = path.join(process.cwd(), 'public/assets/frame.png');

    // 2. XỬ LÝ IMAGEMAGICK
    // Lệnh này resize ảnh về 1200px ngang và đè khung frame.png lên
    try {
      const magicCmd = `magick "${rawPath}" -resize 1200x "${overlayPath}" -composite "${processedPath}"`;
      await execPromise(magicCmd);
    } catch (err) {
      console.error("Lỗi ImageMagick:", err);
      // Nếu lỗi Magick, copy ảnh gốc sang processed để không làm gián đoạn luồng
      fs.copyFileSync(rawPath, processedPath);
    }

    // 3. XÁC THỰC GOOGLE DRIVE
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE_PATH,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    const drive = google.drive({ version: 'v3', auth });

    // 4. TÌM HOẶC TẠO THƯ MỤC TRÊN DRIVE
    let folderId;
    const findFolder = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
    });

    if (findFolder.data.files.length > 0) {
      folderId = findFolder.data.files[0].id;
    } else {
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };
      const newFolder = await drive.files.create({
        resource: folderMetadata,
        fields: 'id',
      });
      folderId = newFolder.data.id;
    }

    // 5. UPLOAD ẢNH ĐÃ XỬ LÝ LÊN DRIVE
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };
    const media = {
      mimeType: 'image/jpeg',
      body: fs.createReadStream(processedPath),
    };

    await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    // 6. TRẢ VỀ FOLDER ID ĐỂ FRONTEND TẠO QR CODE
    return NextResponse.json({ 
      success: true, 
      folderId: folderId,
      message: "Xử lý và upload thành công"
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}