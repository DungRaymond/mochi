import "./globals.css";

export const metadata = {
  title: "Mochi Film Photobooth",
  description: "Next.js 15 Stable Build",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className="bg-mochi-bg text-mochi-gold min-h-screen">
        {children}
      </body>
    </html>
  );
}