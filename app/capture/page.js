'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function CapturePage() {
  const router = useRouter();
  const videoRef = useRef(null);
  
  const [customerName, setCustomerName] = useState('KHACH');
  const [sessionTimeLeft, setSessionTimeLeft] = useState(600); 
  const [lastPhoto, setLastPhoto] = useState(null); 
  const [isCounting, setIsCounting] = useState(false);
  const [count, setCount] = useState(2); 
  const [isProcessing, setIsProcessing] = useState(false);

  // QR & Kết thúc
  const [driveFolderId, setDriveFolderId] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [exitCountDown, setExitCountDown] = useState(5);

  // KÍCH HOẠT LIVE VIEW (Webcam ảo)
  useEffect(() => {
    async function setupLiveView() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Không tìm thấy webcam ảo:", err);
      }
    }
    setupLiveView();

    // Dọn dẹp tên khách
    const savedName = localStorage.getItem('customerName');
    if (savedName) setCustomerName(savedName);

    // Timer Session
    const timer = setInterval(() => {
      if (!showConfirmExit && !showQR) {
        setSessionTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowQR(true);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [showConfirmExit, showQR]);

  // Bộ đếm chụp ảnh
  useEffect(() => {
    let timer;
    if (isCounting && count > 0 && !showConfirmExit) {
      timer = setTimeout(() => setCount(count - 1), 1000);
    } else if (isCounting && count === 0 && !showConfirmExit) {
      triggerCapture();
    }
    return () => clearTimeout(timer);
  }, [isCounting, count, showConfirmExit]);

  useEffect(() => {
    let timer;
    if (showConfirmExit && exitCountDown > 0) {
      timer = setTimeout(() => setExitCountDown(exitCountDown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showConfirmExit, exitCountDown]);

  const triggerCapture = async () => {
    setIsCounting(false);
    setIsProcessing(true);
    
    const fileName = `shot_${Date.now()}.jpg`;
    const folderName = `${customerName}_SESSION`;

    // Upload & Xử lý ngầm
    fetch('/api/upload-drive', {
      method: 'POST',
      body: JSON.stringify({ customerName, fileName, folderName })
    })
    .then(res => res.json())
    .then(data => { if (data.folderId) setDriveFolderId(data.folderId); })
    .catch(err => console.error(err));

    await new Promise(r => setTimeout(r, 1500)); 

    // Cập nhật preview (Sau này map vào đường dẫn processed local)
    setLastPhoto(`https://picsum.photos/seed/${fileName}/600/900`);

    setIsProcessing(false);
    setCount(2); 
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (showQR) {
    const driveLink = driveFolderId ? `https://drive.google.com/drive/folders/${driveFolderId}` : '#';
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-mochi-bg text-mochi-gold p-10 text-center font-serif">
        <h2 className="text-5xl font-black uppercase italic mb-4">Hoàn thành!</h2>
        <div className="bg-white p-6 rounded-xl shadow-2xl mb-10">
          <img src={`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(driveLink)}&choe=UTF-8`} alt="QR Drive" className="w-72 h-72" />
        </div>
        <button onClick={() => { localStorage.removeItem('customerName'); router.push('/'); }} className="px-16 py-5 bg-mochi-gold text-mochi-bg font-black text-2xl uppercase rounded-full">Trở về trang chủ</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-mochi-bg text-mochi-gold p-6 select-none overflow-hidden font-serif relative">
      <div className="flex justify-between items-end mb-4 border-b border-mochi-gold pb-2 flex-shrink-0">
        <div className="text-xl font-black uppercase italic tracking-tighter italic">KH: {customerName}</div>
        <div className="text-4xl font-black tabular-nums">{formatTime(sessionTimeLeft)}</div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0"> 
        {/* VIEW CHÍNH: LIVE VIEW (LỚN HƠN) */}
        <div className="flex-[4] relative border-2 border-mochi-gold bg-black rounded-sm overflow-hidden flex items-center justify-center">
          
          {/* LUỒNG VIDEO TỪ CAMERA */}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover grayscale-[30%] opacity-80"
          />

          {isCounting && <div className="z-10 text-[250px] font-black drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">{count}</div>}
          
          {isProcessing && (
            <div className="z-20 bg-mochi-gold text-mochi-bg px-10 py-5 font-black text-2xl uppercase shadow-2xl">
              Đang xử lý...
            </div>
          )}

          {!isCounting && !isProcessing && !showConfirmExit && (
            <button 
              onClick={() => setIsCounting(true)} 
              className="z-10 w-24 h-24 rounded-full border-4 border-mochi-gold bg-mochi-bg/20 flex items-center justify-center active:scale-90 transition-transform"
            >
              <div className="w-16 h-16 rounded-full bg-mochi-gold"></div>
            </button>
          )}
        </div>

        {/* ẢNH VỪA CHỤP (THU HẸP) */}
        <div className="flex-[2] flex flex-col border-2 border-mochi-gold p-4 bg-black/20 overflow-hidden">
          <div className="text-[10px] font-bold uppercase mb-4 border-b border-mochi-gold/30 pb-2 flex-shrink-0 text-center tracking-[0.2em]">KẾT QUẢ</div>
          
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            {lastPhoto ? (
                <img 
                    src={lastPhoto} 
                    alt="preview" 
                    className="max-w-full max-h-full object-contain border-4 border-white shadow-xl animate-in fade-in duration-500" 
                />
            ) : (
                <div className="text-[10px] uppercase opacity-20 text-center italic">Sẵn sàng chụp</div>
            )}
          </div>
          
          <button 
            onClick={() => { setShowConfirmExit(true); setExitCountDown(5); }}
            className="mt-6 py-4 border-2 border-mochi-gold text-mochi-gold font-black text-xs uppercase flex-shrink-0 active:bg-mochi-gold active:text-mochi-bg transition-colors"
          >
            Kết thúc
          </button>
        </div>
      </div>

      {/* MODAL XÁC NHẬN (5s) */}
      {showConfirmExit && (
        <div className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-10">
          <div className="max-w-xl w-full border-4 border-mochi-gold p-12 text-center bg-mochi-bg">
            <h2 className="text-4xl font-black uppercase italic mb-6">Kết thúc sớm?</h2>
            <div className="flex flex-col gap-5">
              <button disabled={exitCountDown > 0} onClick={() => { setShowConfirmExit(false); setShowQR(true); }} className={`py-6 text-2xl font-black uppercase rounded-full ${exitCountDown > 0 ? 'bg-gray-800 text-gray-500' : 'bg-red-600 text-white'}`}>
                {exitCountDown > 0 ? `Chờ xác nhận (${exitCountDown}s)` : 'Đồng ý & Xem QR'}
              </button>
              <button onClick={() => setShowConfirmExit(false)} className="py-6 text-2xl font-black uppercase text-mochi-gold border-2 border-mochi-gold rounded-full active:bg-mochi-gold active:text-mochi-bg">Tiếp tục chụp</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}