'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    // Lấy tên từ Local Storage
    const savedName = localStorage.getItem('customerName');
    setCustomerName(savedName || 'KHACH');

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-12 bg-mochi-bg text-mochi-gold select-none font-serif">
      <div className="border-t-2 border-b-2 border-mochi-gold px-6 py-2 uppercase font-black text-xl tracking-tighter">
        Mochi Film
      </div>

      <div className="flex flex-col items-center w-full max-w-md">
        <h2 className="text-5xl font-black mb-8 uppercase italic tracking-tight text-center">Thanh toán</h2>
        
        <div className="bg-white p-4 mb-8 shadow-2xl rounded-sm">
           <div className="w-64 h-64 border-[6px] border-black flex flex-col items-center justify-center text-black font-black text-center p-4">
             <div className="text-[10px] opacity-40 mb-2 tracking-[0.2em]">SCAN TO PAY</div>
             <div className="text-3xl leading-none border-b-4 border-black pb-1 mb-2">PAYOS</div>
             <div className="text-sm font-normal italic">Quét mã để chụp ảnh</div>
           </div>
        </div>

        <div className="text-center">
          <p className="text-2xl font-bold uppercase tracking-tight mb-2">Đang chờ thanh toán...</p>
          <div className="text-7xl font-black tabular-nums">{timeLeft}s</div>
        </div>
      </div>

      <div className="w-full flex flex-col items-center gap-6">
        <button 
          onClick={() => router.push('/capture')}
          className="px-12 py-4 bg-mochi-gold text-mochi-bg font-black text-xl uppercase rounded-full active:scale-95 transition-transform"
        >
          Xác nhận đã nhận tiền
        </button>
        <div className="w-full flex justify-between text-[10px] uppercase opacity-40 font-bold tracking-widest">
            <button onClick={() => router.back()}>[ Quay lại ]</button>
            <span>Khách: {customerName}</span>
        </div>
      </div>
    </div>
  );
}