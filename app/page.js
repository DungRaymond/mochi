'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function IdlePage() {
  const [isStarted, setIsStarted] = useState(false);
  const [name, setName] = useState('');
  const router = useRouter();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isStarted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isStarted]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.length >= 3 && name.length <= 12) {
      const upperName = name.toUpperCase();
      // LƯU VÀO LOCAL STORAGE
      localStorage.setItem('customerName', upperName);
      router.push('/select-format');
    } else {
      alert("Tên phải từ 3 đến 12 ký tự!");
    }
  };

  return (
    <div 
      onClick={() => !isStarted && setIsStarted(true)}
      className="flex flex-col items-center justify-between min-h-screen p-16 bg-mochi-bg text-mochi-gold select-none font-serif"
    >
      <div className="mt-10 border-t-4 border-b-4 border-mochi-gold py-2 px-4 uppercase font-black text-2xl tracking-tighter">
        Mochi Film
      </div>

      {!isStarted ? (
        <div className="text-8xl font-black text-center uppercase tracking-tighter">
          Chạm để bắt đầu
        </div>
      ) : (
        <div className="w-full max-w-2xl text-center" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-5xl font-black mb-6 uppercase italic tracking-tight">Nhập tên của bạn</h2>
          <p className="text-lg mb-10 opacity-90 leading-relaxed uppercase font-medium">
            Để chúng mình thông báo khi ảnh xong nhé <br/>
            <span className="opacity-60 text-sm italic">Ví dụ: MOCHI</span>
          </p>

          <form onSubmit={handleSubmit}>
            <input 
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-b-4 border-mochi-gold text-6xl text-center outline-none mb-12 font-black uppercase placeholder:opacity-20"
              placeholder="TÊN CỦA BẠN"
              required
            />
            <button 
              type="submit"
              className="bg-mochi-gold text-mochi-bg px-20 py-5 text-3xl font-black uppercase rounded-full active:scale-95 transition-transform shadow-xl"
            >
              Xác nhận
            </button>
          </form>
          <p className="mt-8 opacity-40 text-xs uppercase tracking-widest font-bold italic">
            Yêu cầu từ 3 đến 12 ký tự • Bàn phím tự động hiển thị
          </p>
        </div>
      )}
      <div className="w-full text-right text-xs opacity-40 uppercase font-bold tracking-widest">
        Mochi Film Photobooth
      </div>
    </div>
  );
}