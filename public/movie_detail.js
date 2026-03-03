(function () {
    'use strict';

    // ၁။ CSS Styles များကို JS မှတစ်ဆင့် Inject လုပ်ခြင်း
    const injectStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            :root { --bg-dark: #0f172a; --card-bg: #1e293b; --primary-red: #ef4444; --accent-blue: #3b82f6; }
            body { margin: 0; font-family: 'Inter', sans-serif; background: var(--bg-dark); color: #f1f5f9; }
            
            .player-wrapper { width: 100%; background: #000; aspect-ratio: 16/9; display: none; position: relative; border-bottom: 2px solid var(--accent-blue); }
            .player-brand { position: absolute; top: 15px; right: 20px; z-index: 10; text-align: right; pointer-events: none; }
            .brand-text { color: white; font-weight: 900; font-size: 18px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); }
            .format-badge { display: block; font-size: 10px; color: var(--accent-blue); font-weight: bold; background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px; }
            
            .container { max-width: 1000px; margin: 20px auto; padding: 20px; display: grid; grid-template-columns: 300px 1fr; gap: 30px; }
            .poster-side img { width: 100%; border-radius: 16px; box-shadow: 0 15px 30px rgba(0,0,0,0.5); }
            .movie-title { font-size: clamp(24px, 5vw, 40px); margin: 0; font-weight: 900; }
            .description-box { background: var(--card-bg); padding: 20px; border-radius: 12px; margin: 15px 0; line-height: 1.6; }
            
            .btn-group { display: flex; gap: 12px; flex-wrap: wrap; }
            .btn { padding: 14px 24px; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 10px; color: white; transition: 0.3s; }
            .play-now { background: var(--accent-blue); }
            .mx-play { background: var(--primary-red); }
            .btn:active { transform: scale(0.95); }

            @media (max-width: 768px) { .container { grid-template-columns: 1fr; text-align: center; } .poster-side img { max-width: 220px; margin: 0 auto; } .btn-group { justify-content: center; } }
        `;
        document.head.appendChild(style);
    };

    // ၂။ UI တစ်ခုလုံးကို ဆွဲထုတ်ခြင်း (Render)
    const renderUI = (movie) => {
        document.body.innerHTML = `
            <a href="index.html" style="position:absolute; top:20px; left:20px; color:white; background:rgba(0,0,0,0.5); width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; z-index:100; text-decoration:none;">
                <i class="fas fa-arrow-left"></i>
            </a>

            <div id="playerSection" class="player-wrapper">
                <div class="player-brand">
                    <span class="brand-text">Fotlivemovies</span>
                    <span class="format-badge">All Formats Supported</span>
                </div>
                <div id="player-container" style="width:100%; height:100%;"></div>
            </div>

            <div class="container">
                <div class="poster-side">
                    <img src="${movie.logo || ''}" alt="Poster">
                </div>
                <div class="info-side">
                    <h1 class="movie-title">${movie.title}</h1>
                    <div style="color:#94a3b8; margin: 10px 0;">${movie.year || '2026'} | ${movie.category || 'Movie'}</div>
                    
                    <div class="description-box">
                        <strong>ဇာတ်လမ်းအညွှန်း</strong><br><br>
                        ${movie.description || 'ဒီဇာတ်ကားကို Fotlivemovies မှာ အခုပဲ ကြည့်ရှုလိုက်ပါ။'}
                    </div>

                    <div class="btn-group">
                        <button data-action="activate-player" class="btn play-now"><i class="fas fa-play-circle"></i> In-App Player</button>
                        <button data-action="open-mx" class="btn mx-play"><i class="fas fa-external-link-alt"></i> MX Player</button>
                    </div>
                </div>
            </div>
        `;
    };

    // ၃။ Logic နှင့် Event Handling
    const init = () => {
        const stored = localStorage.getItem('selectedMovie');
        if (!stored) return;
        const movie = JSON.parse(stored);

        injectStyles();
        renderUI(movie);

        [span_2](start_span)// Event Delegation[span_2](end_span)
        document.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            
            if (action === 'activate-player') {
                const container = document.getElementById('player-container');
                container.innerHTML = `<video controls playsinline autoplay style="width:100%; height:100%;"><source src="${movie.url}" type="video/mp4"></video>`;
                document.getElementById('playerSection').style.display = 'block';
                [span_3](start_span)window.scrollTo({ top: 0, behavior: 'smooth' });[span_3](end_span)
            }

            if (action === 'open-mx') {
                const isAndroid = /android/i.test(navigator.userAgent);
                if (isAndroid) {
                    window.location.href = `intent:${movie.url}#Intent;package=com.mxtech.videoplayer.ad;S.title=${encodeURIComponent(movie.title)};end`;
                } else {
                    window.open(movie.url, '_blank');
                }
            }
        });
    };

    [span_4](start_span)// DOM Ready ဖြစ်တာနဲ့ Run မည်[span_4](end_span)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
