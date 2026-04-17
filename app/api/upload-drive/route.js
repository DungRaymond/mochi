import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);

// --- CẤU HÌNH ---
const EXTERNAL_BASE_PATH = '/home/user/mochi_data'; // Thay 'user' bằng username của bạn
const KEY_FILE_PATH = path.join(process.cwd(), 'service-account.json');

export async function POST(req) {
  try {
    const { customerName, folderName, fileName } = await req.json();

    const rawDir = path.join(EXTERNAL_BASE_PATH, 'raw');
    const processedDir = path.join(EXTERNAL_BASE_PATH, 'processed');
    
    if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
    if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir, { recursive: true });

    const rawPath = path.join(rawDir, fileName);
    const processedPath = path.join(processedDir, fileName);
    const overlayPath = path.join(process.cwd(), 'public/assets/frame.png');

    // --- BƯỚC 1: GỌI GPHOTO2 CHỤP ẢNH THẬT ---
    try {
      // Giải phóng máy ảnh khỏi tiến trình hệ thống trước khi chụp
      await execPromise('killall gvfs-gphoto2-volume-monitor || true');
      
      const captureCmd = `gphoto2 --capture-image-and-download --filename "${rawPath}"`;
      await execPromise(captureCmd);
    } catch (err) {
      console.error("Lỗi Gphoto2:", err);
      return NextResponse.json({ success: false, error: "Máy ảnh không phản hồi" }, { status: 500 });
    }

    // --- BƯỚC 2: XỬ LÝ IMAGEMAGICK (FILTER RETRO VINTAGE) ---
    // Giải thích các thông số:
    // -resize 1200x: Co ảnh về 1200px ngang
    // -sepia-tone 60%: Ngả vàng nâu cổ điển
    // -modulate 100,70: Giữ độ sáng, giảm 30% độ bão hòa màu
    // -attenuate 0.5 +noise Gaussian: Thêm hạt film (grain)
    try {
      const magicCmd = `magick "${rawPath}" -resize 1200x \
        -sepia-tone 60% \
        -modulate 100,70 \
        -contrast-stretch 2%x2% \
        -attenuate 0.4 +noise Gaussian \
        "${overlayPath}" -composite "${processedPath}"`;
      
      await execPromise(magicCmd);
    } catch (err) {
      console.error("Lỗi ImageMagick:", err);
      fs.copyFileSync(rawPath, processedPath); // Backup nếu lỗi filter
    }

    // --- BƯỚC 3: GOOGLE DRIVE ---
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE_PATH,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    const drive = google.drive({ version: 'v3', auth });

    let folderId;
    const findFolder = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
    });

    if (findFolder.data.files.length > 0) {
      folderId = findFolder.data.files[0].id;
    } else {
      const newFolder = await drive.files.create({
        resource: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
        fields: 'id',
      });
      folderId = newFolder.data.id;
    }

    // Upload file ngầm
    const media = {
      mimeType: 'image/jpeg',
      body: fs.createReadStream(processedPath),
    };
    await drive.files.create({
      resource: { name: fileName, parents: [folderId] },
      media: media,
      fields: 'id',
    });

    return NextResponse.json({ 
      success: true, 
      folderId: folderId,
      fileName: fileName
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}