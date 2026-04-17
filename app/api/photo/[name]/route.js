import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req, { params }) {
  const photoName = params.name;
  const filePath = path.join('/home/user/mochi_data/processed', photoName);

  if (!fs.existsSync(filePath)) {
    return new NextResponse('File không tồn tại', { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    headers: { 'Content-Type': 'image/jpeg' },
  });
}