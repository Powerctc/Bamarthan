import { Inter } from 'next/font/google'
import Script from 'next/script' // ဒါလေး ထပ်ထည့်ပါ
import './css/style.css' 

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'S4ITMM TV - Mobile',
  description: 'Smart Access Control for Android Devices',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-slate-900 text-white antialiased`}>
        <main className="min-h-screen flex flex-col">
          {children}
        </main>

        {/* Offline Service Worker Registration Script */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(reg) {
                  console.log('S4ITMM Service Worker: Active');
                }).catch(function(err) {
                  console.log('Service Worker Error:', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
          }
