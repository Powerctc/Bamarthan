/** @type {import('tailwindcss').Config} */
module.exports = {
  // ၁။ Tailwind အလုပ်လုပ်မယ့် ဖိုင်လမ်းကြောင်းများကို သတ်မှတ်ခြင်း
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // အကယ်၍ src folder သုံးထားလျှင် 
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  
  theme: {
    extend: {
      // ၂။ သင့် App အတွက် သီးသန့် အရောင်များ သတ်မှတ်ခြင်း (Optional)
      colors: {
        's4itmm-red': '#ef4444',
        's4itmm-dark': '#0f172a',
      },
      // ၃။ Loading spinner နှင့် Animations များအတွက် သတ်မှတ်ချက်
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  
  // ၄။ Plugin များ ထည့်သွင်းလိုပါက (ဥပမာ - Forms သို့မဟုတ် Typography)
  plugins: [],
          }
