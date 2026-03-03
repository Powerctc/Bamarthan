document.addEventListener('DOMContentLoaded', function() {
    // LocalStorage မှ Data ဖတ်ခြင်း
    const rawData = localStorage.getItem("selectedMovie");
    
    if (!rawData) {
        window.location.href = "index.html";
        return;
    }

    const series = JSON.parse(rawData);

    // UI Elements များကို Data ထည့်သွင်းခြင်း
    document.getElementById('header-title').innerText = series.title;
    document.getElementById('series-title').innerText = series.title;
    document.getElementById('series-poster').src = series.logo;
    document.getElementById('series-year').innerText = series.year || '2026';
    document.getElementById('series-cat').innerText = series.category || 'SERIES';
    document.getElementById('series-desc').innerText = series.description || 'ဇာတ်လမ်းအညွှန်း မရှိသေးပါ။';

    const epContainer = document.getElementById('episode-list');
    const player = document.getElementById('main-player');
    const placeholder = document.getElementById('player-placeholder');
    const statusText = document.getElementById('playing-status');

    // Episode Grid ဆောက်ခြင်း
    if (series.episodes && Array.isArray(series.episodes) && series.episodes.length > 0) {
        series.episodes.forEach((ep, index) => {
            const btn = document.createElement('button');
            // List Page နဲ့ Design တူအောင် ပြုလုပ်ထားသည်
            btn.className = "ep-btn bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 py-3.5 rounded-xl text-[11px] font-black transition-all active:scale-90 shadow-sm";
            btn.innerText = ep.label || `E ${index + 1}`;
            
            btn.onclick = () => {
                // Active Class ပြောင်းလဲခြင်း
                document.querySelectorAll('.ep-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Player ဖွင့်ခြင်း
                placeholder.classList.add('hidden');
                player.classList.remove('hidden');
                player.src = ep.url;
                
                // Status ပြခြင်း
                statusText.classList.remove('hidden');
                statusText.innerText = `Playing: ${ep.label}`;

                // Player ဆီသို့ အလိုအလျောက် Scroll ဆွဲတင်ပေးခြင်း
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            
            epContainer.appendChild(btn);
        });
    } else {
        epContainer.innerHTML = `
            <div class="col-span-full text-center py-10 opacity-30 font-bold uppercase text-[10px] tracking-widest">
                No Episodes Available.
            </div>
        `;
    }
});
