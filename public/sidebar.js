document.addEventListener("DOMContentLoaded", function() {
    const sidebarHTML = `
    <div id="backdrop" class="fixed inset-0 bg-black/60 z-[60] hidden transition-opacity duration-300"></div>
    <aside id="sidebar" class="fixed top-0 -left-full w-72 h-full bg-white dark:bg-darkBg z-[70] transition-all duration-300 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
        <div class="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h2 class="text-primary font-black text-2xl">FOTMOV</h2>
            <button id="close-menu" class="text-slate-400 p-2"><i class="fas fa-times text-xl"></i></button>
        </div>
        <nav class="p-4 space-y-1">
            <a href="https://bamarthan.vercel.app/" class="nav-item flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300">
                <i class="fas fa-home w-5 text-center"></i>မြန်မာသံ⚽လိုက်ဖ်
            </a>
            <a href="https://bamarthan.vercel.app/movies..html" class="nav-item flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300">
                <i class="fas fa-film text-primary w-5 text-center"></i>မြန်မာစာတန်းထိုး
            </a>
            <a href="https://bamarthan.vercel.app/series/index.html" class="nav-item flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300">
                <i class="fas fa-film text-primary w-5 text-center"></i>ဇာတ်လမ်းတွဲ
            </a>
            <a href="https://m-sport-download.static.hf.space" class="nav-item flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300">
                <i class="fas fa-futbol text-blue-500 w-5 text-center"></i>Today Live
            </a>
            
            <a href="https://m-sport-download.static.hf.space/Vpnkey.html" class="nav-item flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300">
                <i class="fas fa-hand-fist text-blue-500 w-5 text-center"></i>Hiddifykey 
            </a>
            <a href="https://m-sport-download.static.hf.space" class="nav-item flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300">
                <i class="fas fa-satellite-dish text-red-500 w-5 text-center"></i>မြန်မာတီဗွီ
            </a>
            <hr class="opacity-10 my-2">
            
            <a href="https://bamarthan.vercel.app/adults/index.html" class="nav-item flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                <i class="fas fa-eye-slash w-5 text-center"></i>Adults (18+)
            </a>
            <a href="https://m-sport-download.static.hf.space" class="nav-item flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300">
                <i class="fas fa-tv w-5 text-center"></i> App ဒေါင်းရန်
            </a>
            <a href="https://bamarthan.vercel.app/About.html" class="nav-item flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300">
                <i class="fas fa-circle-info w-5 text-center"></i>About App
            </a>
        </nav>
    </aside>`;

    const container = document.getElementById('sidebar-container');
    if (container) {
        container.innerHTML = sidebarHTML;
        
        // Sidebar Logic - IDs နှစ်ခုလုံးကို စစ်အောင်လုပ်ထားတယ်
        const menuBtn = document.getElementById('menu-btn') || document.getElementById('menu-toggle');
        const closeBtn = document.getElementById('close-menu');
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('backdrop');

        // === [၁] "နှိပ်ပါ" Guide တပ်ဆင်ခြင်း Logic ===
        if (menuBtn && !localStorage.getItem('menu_hint_hidden')) {
            // တုန်ခါမှု Animation အတွက် Custom CSS ထည့်သွင်းခြင်း
            const style = document.createElement('style');
            style.innerHTML = `
                @keyframes bounceHorizontal {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(-6px); }
                }
                .animate-bounce-horizontal {
                    animation: bounceHorizontal 0.8s infinite;
                }
            `;
            document.head.appendChild(style);

            // "နှိပ်ပါ" အညွှန်းလွှာ HTML ဖန်တီးခြင်း
            const hintHTML = `
                <div id="menu-hint" class="fixed top-[30px] left-[52px] z-[50] flex items-center animate-bounce-horizontal pointer-events-none transition-all duration-300">
                    <div class="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-amber-400"></div>
                    <div class="bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded shadow-lg tracking-wider whitespace-nowrap">
                        နှိပ်ပါ
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', hintHTML);
        }

        const toggle = (show) => {
            if (!sidebar || !backdrop) return;
            sidebar.style.left = show ? '0' : '-100%';
            backdrop.classList.toggle('hidden', !show);

            // === [၂] ခလုတ်နှိပ်လိုက်လျှင် အညွှန်းကို ဖျောက်ပြီး ထပ်မပေါ်အောင် လုပ်ဆောင်ခြင်း ===
            if (show) {
                const hint = document.getElementById('menu-hint');
                if (hint) {
                    hint.style.opacity = '0';
                    hint.style.transform = 'scale(0.75)';
                    setTimeout(() => hint.remove(), 300);
                    localStorage.setItem('menu_hint_hidden', 'true');
                }
            }
        };

        // Click Events
        if (menuBtn) {
            menuBtn.onclick = (e) => {
                e.preventDefault();
                toggle(true);
            };
        }
        
        if (closeBtn) closeBtn.onclick = () => toggle(false);
        if (backdrop) backdrop.onclick = () => toggle(false);

        // Active Link Highlighting logic...
        const currentPath = window.location.href;
        document.querySelectorAll('.nav-item').forEach(item => {
            const link = item.getAttribute('href');
            if (link && currentPath.includes(link)) {
                item.classList.add('bg-primary', 'text-black', 'font-bold', 'shadow-md', 'shadow-primary/20');
                item.classList.remove('text-slate-600', 'dark:text-slate-300');
            }
        });
    }
});
                
