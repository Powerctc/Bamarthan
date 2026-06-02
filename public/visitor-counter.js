document.addEventListener("DOMContentLoaded", function() {
    // ⚙️ FAKE COUNT ပြင်ဆင်ရန်နေရာ (ဒီနေရာက ဂဏန်းတွေကို စိတ်ကြိုက်ပြောင်းပါ)
    const FAKE_CONFIG = {
        activeBase: 25,     // လက်ရှိကြည့်သူကို အနည်းဆုံး ၂၅ ဦး အမြဲပြထားမည်
        todayBase: 340,     // ယနေ့ကြည့်သူကို အနည်းဆုံး ၃၄၀ ဦး အမြဲပြထားမည်
        totalBase: 12450,   // စုစုပေါင်းကြည့်သူကို အနည်းဆုံး ၁၂၄၅၀ ဦး အမြဲပြထားမည်
        fluctuationRange: 3 // လက်ရှိကြည့်သူကို ငြိမ်မနေစေဘဲ (ဥပမာ +၃ သို့မဟုတ် -၃) ပုံစံဖြင့် လှုပ်ရှားနေစေရန်
    };

    // HTML ထဲက Container Div ကို ရှာခြင်း
    const targetDiv = document.querySelector('.visitor-stats-container');
    if (!targetDiv) return;

    // Component ရဲ့ HTML နှင့် CSS ဒီဇိုင်း
    targetDiv.innerHTML = `
        <style>
            .visitor-box-wrap {
                background: #1e293b;
                border: 1px solid #334155;
                border-radius: 12px;
                padding: 16px;
                margin-top: 35px;
                max-width: 400px;
                margin-left: auto;
                margin-right: auto;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            .visitor-title-flex {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            .visitor-title-flex h4 {
                font-size: 13px;
                font-weight: bold;
                color: #f1f5f9;
                letter-spacing: 0.5px;
            }
            .status-badge {
                font-size: 10px;
                padding: 2px 8px;
                border-radius: 20px;
                font-weight: bold;
                text-transform: uppercase;
            }
            .status-live { background: rgba(16, 185, 129, 0.1); color: #10b981; }
            .status-down { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
            
            .visitor-table {
                display: flex;
                flex-direction: column;
                gap: 1px;
                background: #334155;
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid #334155;
            }
            .visitor-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: #1e293b;
            }
            .visitor-label {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 12px;
                color: #94a3b8;
                font-weight: 600;
            }
            .visitor-label i { width: 16px; text-align: center; }
            .visitor-value {
                font-size: 15px;
                font-weight: 900;
                font-family: monospace, sans-serif;
            }
            .icon-active { color: #60a5fa; }
            .icon-today { color: #fbbf24; }
            .icon-total { color: #c084fc; }
        </style>

        <div class="visitor-box-wrap">
            <div class="visitor-title-flex">
                <h4>ဝဘ်ဆိုဒ်ကြည့်ရှုမှုစာရင်း</h4>
                <span id="v-status" class="status-badge status-down">● Connecting</span>
            </div>
            <div class="visitor-table">
                <div class="visitor-row">
                    <div class="visitor-label"><i class="fas fa-users icon-active"></i> လက်ရှိကြည့်ရှုသူ (Active)</div>
                    <div id="v-active" class="visitor-value" style="color: #60a5fa;">0</div>
                </div>
                <div class="visitor-row">
                    <div class="visitor-label"><i class="fas fa-calendar-alt icon-today"></i> ယနေ့ကြည့်ရှုသူ (Today)</div>
                    <div id="v-today" class="visitor-value" style="color: #fbbf24;">0</div>
                </div>
                <div class="visitor-row">
                    <div class="visitor-label"><i class="fas fa-eye icon-total"></i> စုစုပေါင်းကြည့်ရှုသူ (Total)</div>
                    <div id="v-total" class="visitor-value" style="color: #c084fc;">0</div>
                </div>
            </div>
        </div>
    `;

    const wsUrl = "wss://bamarthan-visitor-counter.hf.space/ws/analytics"; 
    let ws;
    let realActive = 0;
    let realToday = 0;
    let realTotal = 0;
    let flucInterval;

    function updateUI() {
        // Real Data နှင့် Fake Base ကို ပေါင်းခြင်း
        let displayToday = realToday + FAKE_CONFIG.todayBase;
        let displayTotal = realTotal + FAKE_CONFIG.totalBase;
        
        // Active User ကို ပိုပြီး သဘာဝကျကျ လှုပ်ရှားနေစေရန် Random ဂဏန်း အနည်းငယ် ပေါင်း/နှုတ် လုပ်ခြင်း
        let randomOffset = Math.floor(Math.random() * (FAKE_CONFIG.fluctuationRange * 2 + 1)) - FAKE_CONFIG.fluctuationRange;
        let displayActive = realActive + FAKE_CONFIG.activeBase + randomOffset;
        
        // Active ပြကွက် အနုတ်လက္ခဏာ မဖြစ်သွားစေရန် ထိန်းခြင်း
        if (displayActive < 0) displayActive = 0;

        // မျက်နှာပြင်ပေါ်တွင် ဂဏန်းများ လှပစွာ ကော်မာ ( , ) ဖြတ်ပြီး ပြသခြင်း
        document.getElementById('v-active').innerText = Number(displayActive).toLocaleString();
        document.getElementById('v-today').innerText = Number(displayToday).toLocaleString();
        document.getElementById('v-total').innerText = Number(displayTotal).toLocaleString();
    }

    function connectAnalytics() {
        ws = new WebSocket(wsUrl);
        const statusEl = document.getElementById('v-status');

        ws.onopen = () => {
            statusEl.innerText = "● Live";
            statusEl.className = "status-badge status-live";
            
            // WebSocket မိသွားရင် ၂ စက္ကန့်တစ်ကြိမ် Active count ကို ငြိမ်မနေဘဲ လှုပ်ရှားနေအောင် လုပ်ခြင်း
            clearInterval(flucInterval);
            flucInterval = setInterval(updateUI, 2000);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Server ကလာတဲ့ တကယ့် Real data ကို သိမ်းထားခြင်း
                realActive = Number(data.active) || 0;
                realToday = Number(data.today) || 0;
                realTotal = Number(data.total) || 0;
                
                updateUI();
            } catch (err) {
                console.error("Data error:", err);
            }
        };

        ws.onclose = () => {
            statusEl.innerText = "● Offline";
            statusEl.className = "status-badge status-down";
            clearInterval(flucInterval);
            
            // Server နှင့် လိုင်းပြတ်သွားလျှင်လည်း အခြေခံ Fake data ကို ဆက်ပြထားပေးခြင်း
            updateUI();
            
            // ၅ စက္ကန့်တစ်ကြိမ် Auto ပြန်ချိတ်ရန် စောင့်ခြင်း
            setTimeout(connectAnalytics, 5000); 
        };

        ws.onerror = (err) => {
            ws.close();
        };
    }

    connectAnalytics();
});
