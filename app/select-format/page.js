import Link from 'next/link';

export default function SelectFormat() {
  return (
    <div className="flex flex-col items-center p-20 min-h-screen bg-mochi-bg">
      <h2 className="text-6xl font-black mb-20 uppercase italic text-mochi-gold">CHỌN ĐỊNH DẠNG</h2>
      <div className="flex gap-10">
        <Link href="/payment" className="border-4 border-mochi-gold p-12 text-center hover:bg-mochi-gold hover:text-mochi-bg transition-all">
          <h3 className="text-4xl font-bold">STRIP 1x4</h3>
          <p className="text-xl mt-2">50.000 VNĐ</p>
        </Link>
        <Link href="/payment" className="border-4 border-mochi-gold p-12 text-center hover:bg-mochi-gold hover:text-mochi-bg transition-all">
          <h3 className="text-4xl font-bold">SQUARE 2x2</h3>
          <p className="text-xl mt-2">70.000 VNĐ</p>
        </Link>
      </div>
    </div>
  );
}