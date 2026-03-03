/**
 * Fotlivemovies Series SPA Detail Module
 */

function showSeriesDetails(series) {
    const container = document.getElementById('detail-view-container');
    
    // UI ဆောက်ခြင်း
    container.innerHTML = `
        <button onclick="closeDetails()" class="fixed top-5 left-5 z-[110] bg-black/50 backdrop-blur-md w-10 h-10 rounded-full text-white border border-white/10">
            <i class="fas fa-arrow-left"></i>
        </button>

        <div id="playerSection" class="w-full bg-black aspect-video relative hidden border-b-2 border-primary sticky top-0 z-50">
            <div class="absolute top-4 right-4 text-right z-10 pointer-events-none">
                <span class="text-primary font-black text-lg tracking-tighter shadow-lg">FOTMOV</span>
                <span id="playing-status" class="block text-[8px] bg-blue-600/80 text-white px-1.5 py-0.5 rounded uppercase font-bold">Now Playing</span>
            </div>
            <div id="video-box" class="w-full h-full"></div>
        </div>

        <div class="p-5 max-w-4xl mx-auto">
            <div class="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div class="w-40 flex-shrink-0">
                    <img src="${series.logo}" class="w-full rounded-2xl shadow-2xl border border-white/10">
                </div>
                <div class="flex-1 text-center md:text-left">
                    <h1 class="text-2xl font-black text-white leading-tight">${series.title}</h1>
                    <div class="flex items-center justify-center md:justify-start gap-3 mt-2 text-primary font-bold text-xs uppercase tracking-widest">
                        <span>${series.year || '2026'}</span>
                        <span class="w-1 h-1 bg-slate-600 rounded-full"></span>
                        <span>${series.category || 'Series'}</span>
                    </div>

                    <div class="bg-darkCard/50 border border-slate-800 p-4 rounded-2xl mt-5 text-slate-300 text-sm leading-relaxed text-left">
                        <strong class="text-white block mb-2 font-bold uppercase text-[10px] tracking-widest text-primary">Synopsis</strong>
                        ${series.description || 'ဒီဇာတ်လမ်းတွဲကို Fotlivemovies မှာ အခုပဲ ကြည့်ရှုလိုက်ပါ။ အပိုင်းစုံကို အရည်အသွေးအကြည်ဖြင့် တင်ဆက်ထားပါသည်။'}
                    </div>

                    <div class="mt-8 text-left">
                        <h3 class="text-white font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                            <i class="fas fa-list-ol text-primary"></i> Select Episode
                        </h3>
                        <div id="episode-grid" class="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="player-options" class="fixed bottom-0 left-0 w-full bg-darkCard p-6 rounded-t-3xl border-t border-slate-800 transform translate-y-full transition-transform duration-300 z-[120] shadow-2xl">
            <div class="flex justify-between items-center mb-4">
                <h4 id="selected-ep-name" class="font-bold text-primary">Episode Name</h4>
                <button onclick="hidePlayerOptions()" class="text-slate-400"><i class="fas fa-times"></i></button>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <button id="inapp-btn" class="bg-blue-600 p-4 rounded-2xl font-black text-xs text-white active:scale-95 transition-all">
                    <i class="fas fa-play mr-1"></i> IN-APP PLAYER
                </button>
                <button id="mx-btn" class="bg-red-600 p-4 rounded-2xl font-black text-xs text-white active:scale-95 transition-all">
                    <i class="fas fa-external-link-alt mr-1"></i> MX PLAYER
                </button>
            </div>
        </div>
    `;

    // Render Episode Buttons
    const epGrid = document.getElementById('episode-grid');
    if (series.episodes && series.episodes.length > 0) {
        series.episodes.forEach((ep, index) => {
            const btn = document.createElement('button');
            btn.className = "bg-slate-800 hover:bg-primary hover:text-black border border-slate-700 py-3 rounded-xl text-[10px] font-black transition-all active:scale-90";
            btn.innerText = ep.label || `E${index + 1}`;
            btn.onclick = () => showPlayerOptions(ep.url, ep.label || `Episode ${index + 1}`);
            epGrid.appendChild(btn);
        });
    }

    // Show with animation
    container.classList.remove('hidden');
    setTimeout(() => container.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';
}

function showPlayerOptions(url, title) {
    const sheet = document.getElementById('player-options');
    document.getElementById('selected-ep-name').innerText = title;
    
    document.getElementById('inapp-btn').onclick = () => {
        playInApp(url, title);
        hidePlayerOptions();
    };
    
    document.getElementById('mx-btn').onclick = () => {
        playMX(url, title);
        hidePlayerOptions();
    };

    sheet.style.transform = "translateY(0)";
}

function hidePlayerOptions() {
    document.getElementById('player-options').style.transform = "translateY(100%)";
}

function playInApp(url, title) {
    const playerSection = document.getElementById('playerSection');
    const videoBox = document.getElementById('video-box');
    const status = document.getElementById('playing-status');
    
    playerSection.classList.remove('hidden');
    status.innerText = `Playing: ${title}`;
    
    videoBox.innerHTML = `
        <video id="main-video" controls playsinline autoplay class="w-full h-full object-contain">
            <source src="${url}" type="video/mp4">
        </video>
    `;
    
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

function closeDetails() {
    const container = document.getElementById('detail-view-container');
    container.classList.remove('active');
    setTimeout(() => {
        container.classList.add('hidden');
        container.innerHTML = '';
    }, 300);
    document.body.style.overflow = 'auto';
    }
        
