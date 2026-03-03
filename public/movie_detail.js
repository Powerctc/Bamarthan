/**
 * Fotlivemovies SPA Detail Module
 */

function showMovieDetails(movie) {
    const container = document.getElementById('detail-view-container');
    
    // UI ဆောက်ခြင်း
    container.innerHTML = `
        <button onclick="closeDetails()" class="fixed top-5 left-5 z-[110] bg-black/50 backdrop-blur-md w-10 h-10 rounded-full text-white border border-white/10">
            <i class="fas fa-arrow-left"></i>
        </button>

        <div id="playerSection" class="w-full bg-black aspect-video relative hidden border-b-2 border-primary">
            <div class="absolute top-4 right-4 text-right z-10 pointer-events-none">
                <span class="text-primary font-black text-lg tracking-tighter shadow-lg">FOTMOV</span>
                <span class="block text-[8px] bg-blue-600/80 text-white px-1.5 py-0.5 rounded uppercase font-bold">All Format Support</span>
            </div>
            <div id="video-box" class="w-full h-full"></div>
        </div>

        <div class="p-5 max-w-4xl mx-auto">
            <div class="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div class="w-40 flex-shrink-0">
                    <img src="${movie.logo}" class="w-full rounded-2xl shadow-2xl border border-white/10">
                </div>
                <div class="flex-1 text-center md:text-left">
                    <h1 class="text-2xl font-black text-white leading-tight">${movie.title}</h1>
                    <div class="flex items-center justify-center md:justify-start gap-3 mt-2 text-primary font-bold text-xs uppercase tracking-widest">
                        <span>${movie.year || '2026'}</span>
                        <span class="w-1 h-1 bg-slate-600 rounded-full"></span>
                        <span>${movie.category}</span>
                    </div>

                    <div class="bg-darkCard/50 border border-slate-800 p-4 rounded-2xl mt-5 text-slate-300 text-sm leading-relaxed text-left">
                        <strong class="text-white block mb-2 font-bold">ဇာတ်လမ်းအညွှန်း</strong>
                        ${movie.description || 'ဒီဇာတ်ကားကို Fotlivemovies မှာ အခုပဲ ကြည့်ရှုလိုက်ပါ။ အရည်အသွေးအကြည်ဖြင့် အခမဲ့ တင်ဆက်ထားပါသည်။'}
                    </div>

                    <div class="grid grid-cols-2 gap-3 mt-6">
                        <button onclick="playInApp('${movie.url}')" class="bg-blue-600 hover:bg-blue-700 p-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 text-white">
                            <i class="fas fa-play-circle text-lg"></i> IN-APP PLAYER
                        </button>
                        <button onclick="playMX('${movie.url}', '${movie.title}')" class="bg-red-600 hover:bg-red-700 p-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 text-white">
                            <i class="fas fa-external-link-alt text-lg"></i> MX PLAYER
                        </button>
                    </div>

                    <div class="mt-6 p-4 bg-primary/10 rounded-xl border-l-4 border-primary text-[11px] text-slate-400">
                        <i class="fas fa-info-circle text-primary mr-1"></i>
                        Browser မှာတင်ကြည့်ရန် <b>In-App</b> ကိုနှိပ်ပါ။ ပိုမိုမြန်ဆန်သွက်လက်စေရန် Android ဖုန်းများတွင် <b>MX Player</b> ကိုသုံးပါ။
                    </div>
                </div>
            </div>
        </div>
    `;

    // Show with animation
    container.classList.remove('hidden');
    setTimeout(() => container.classList.add('active'), 10);
    document.body.style.overflow = 'hidden'; // Scroll disable
}

function closeDetails() {
    const container = document.getElementById('detail-view-container');
    container.classList.remove('active');
    setTimeout(() => {
        container.classList.add('hidden');
        container.innerHTML = ''; // Reset memory
    }, 300);
    document.body.style.overflow = 'auto'; // Scroll enable
}

function playInApp(url) {
    const playerSection = document.getElementById('playerSection');
    const videoBox = document.getElementById('video-box');
    
    playerSection.classList.remove('hidden');
    videoBox.innerHTML = `
        <video id="main-video" controls playsinline autoplay class="w-full h-full object-contain">
            <source src="${url}" type="video/mp4">
            Your browser does not support video.
        </video>
    `;
    
    // Smooth scroll to top
    document.getElementById('detail-view-container').scrollTo({ top: 0, behavior: 'smooth' });
}

function playMX(url, title) {
    const isAndroid = /android/i.test(navigator.userAgent);
    if (isAndroid) {
        const intent = `intent:${url}#Intent;package=com.mxtech.videoplayer.ad;S.title=${encodeURIComponent(title)};end`;
        window.location.href = intent;
    } else {
        window.open(url, '_blank');
    }
}
