document.addEventListener("DOMContentLoaded", () => {
    const state = { lang: 'en', theme: localStorage.getItem('theme') || 'dark', data: {} };
    const dom = {
        title: document.getElementById('typingTitle'),
        bio: document.getElementById('bioContent'),
        journals: document.getElementById('journalList'),
        conferences: document.getElementById('confList'),
        patents: document.getElementById('patentList'),
        sJournal: document.getElementById('serviceJournalList'),
        sConf: document.getElementById('serviceConfList'),
        cursorDot: document.getElementById('cursorDot'),
        cursorOutline: document.getElementById('cursorOutline'),
        progress: document.getElementById('scrollProgress')
    };

    const cursor = { x: 0, y: 0, targetX: 0, targetY: 0 };
    
    init();

    async function init() {
        applyTheme();
        await loadData();
        renderAll();
        setupEffects();
        setupTabs();
        setupSteganography();
        setupClickEffects(); 
        typeWriter("Yijie Lin（林翼洁）", dom.title);
    }

    async function loadData() {
        try {
            const [profile, journals, conferences, patents, service] = await Promise.all([
                fetch('data/profile.json').then(r => r.json()),
                fetch('data/journals.json').then(r => r.json()),
                fetch('data/conferences.json').then(r => r.json()),
                fetch('data/patents.json').then(r => r.json()),
                fetch('data/service.json').then(r => r.json())
            ]);
            state.data = { profile, journals, conferences, patents, service };
        } catch (e) {
            console.error(e);
            dom.bio.innerHTML = "<span style='color:red'>Data load failed. Please use Live Server.</span>";
        }
    }

    function renderAll() {
        if (!state.data.profile) return;
        
        const text = state.lang === 'en' ? state.data.profile.intro.en : state.data.profile.intro.zh_Hans;
        dom.bio.innerHTML = `<div class="bio-text fade-in">${text}</div>`;
        
        renderList(state.data.journals, dom.journals, true);
        renderList(state.data.conferences, dom.conferences, true);
        renderPatents(state.data.patents);
        renderService(state.data.service);
        updateStaticText();
    }

    function renderList(data, container, showIndex) {
        container.innerHTML = '';
        const sortedData = [...data].sort((a, b) => (b.id || 0) - (a.id || 0));

        sortedData.forEach((p, idx) => {
            const card = document.createElement('div');
            card.className = 'paper-card tilt-card';
            card.style.animationDelay = `${idx * 100}ms`;

            const authors = p.authors.replace(/Yijie Lin/g, '<span style="color:var(--accent);font-weight:700;">Yijie Lin</span>');
            const tags = p.tags ? p.tags.map(t => `<span class="tag" data-type="${t}">${t}</span>`).join('') : '';
            
            let publicationInfo = p.journal || p.conference; 
            const parts = [];
            if (p.volume) parts.push(`Vol. ${p.volume}`);
            if (p.issue) parts.push(`No. ${p.issue}`);
            if (p.articleId) parts.push(`Article ${p.articleId}`);
            if (p.pages) parts.push(`pp. ${p.pages}`);
            if (p.year) parts.push(`${p.year}`);
            if (parts.length > 0) publicationInfo += `, ${parts.join(', ')}`;

            const statusHtml = p.status ? ` <b style="color:var(--accent)">(${p.status})</b>` : '';

            let linksHtml = '';
            if (p.links) {
                if (p.links.doi) linksHtml += `<a href="${p.links.doi}" target="_blank" style="margin-right:15px; color:var(--text-primary); text-decoration:none; font-size:0.9rem; transition: color 0.2s;"><i class="fas fa-link"></i> DOI</a>`;
                if (p.links.pdf) linksHtml += `<a href="${p.links.pdf}" target="_blank" style="color:var(--text-primary); text-decoration:none; font-size:0.9rem; transition: color 0.2s;"><i class="fas fa-file-pdf"></i> PDF</a>`;
            }
            
            const indexHtml = showIndex ? `<span class="index-num" style="color:var(--text-secondary); font-weight:600; opacity:0.7; margin-right:8px; display:inline-block; min-width:25px;">#${idx+1}</span>` : '';

            card.innerHTML = `
                <div class="paper-title">${indexHtml}${p.title}</div>
                <div style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:5px;">${authors}</div>
                <div style="font-size:0.85rem; opacity:0.8;">${publicationInfo}${statusHtml}</div>
                <div class="tags" style="margin-top:10px">${tags}</div>
                <div style="margin-top:10px;">${linksHtml}</div>
            `;
            container.appendChild(card);
            initTilt(card);
        });
    }

    function renderPatents(data) {
        dom.patents.innerHTML = '';
        data.forEach((p, idx) => {
            const card = document.createElement('div');
            card.className = 'paper-card tilt-card';
            card.style.animationDelay = `${idx * 100}ms`;
            const indexHtml = `<span class="index-num" style="color:var(--text-secondary); font-weight:600; opacity:0.7; margin-right:8px;">#${idx+1}</span>`;
            card.innerHTML = `<div class="paper-title">${indexHtml}${p.title}</div><div style="font-size:0.9rem">${p.authors}</div><div class="tag" style="margin-top:5px">${p.status}</div>`;
            dom.patents.appendChild(card);
            initTilt(card);
        });
    }

    function renderService(data) {
        const fill = (list, target) => {
            target.innerHTML = '';
            list.forEach((i, idx) => {
                const li = document.createElement('li');
                li.style.animation = `fadeSlideUpStagger 0.5s ease forwards ${idx * 50}ms`;
                li.style.opacity = '0';
                const tags = i.tags ? i.tags.map(t => `<span class="tag" data-type="${t}">${t}</span>`).join('') : '';
                li.innerHTML = `<span>${i.name}</span><div>${tags}</div>`;
                target.appendChild(li);
            });
        };
        fill(data.journals, dom.sJournal);
        fill(data.conferences, dom.sConf);
    }

    function setupClickEffects() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            if (target.closest('button') || target.closest('a') || target.closest('.tab-btn') || target.closest('.decrypt-btn')) {
                spawnBurst(e.clientX, e.clientY);
                return;
            }

            if (target.closest('.paper-card') || target.closest('.stego-console')) {
                spawnSonicRing(e.clientX, e.clientY);
                return;
            }

            spawnRipple(e.clientX, e.clientY);
        });

        function spawnRipple(x, y) {
            const el = document.createElement('div');
            el.className = 'click-ripple';
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 600);
        }

        function spawnBurst(x, y) {
            const particleCount = 8;
            for (let i = 0; i < particleCount; i++) {
                const el = document.createElement('div');
                el.className = 'click-burst-particle';
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;
                
                const angle = (Math.PI * 2 * i) / particleCount;
                const dist = 20 + Math.random() * 30;
                
                el.style.setProperty('--tx', `calc(-50% + ${Math.cos(angle) * dist}px)`);
                el.style.setProperty('--ty', `calc(-50% + ${Math.sin(angle) * dist}px)`);
                
                document.body.appendChild(el);
                setTimeout(() => el.remove(), 500);
            }
        }

        function spawnSonicRing(x, y) {
            const el = document.createElement('div');
            el.className = 'click-sonic';
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 500);
        }
    }

    function setupEffects() {
        document.addEventListener('mousemove', (e) => {
            cursor.targetX = e.clientX;
            cursor.targetY = e.clientY;
            dom.cursorDot.style.left = `${e.clientX}px`; 
            dom.cursorDot.style.top = `${e.clientY}px`;
        });

        function animateCursor() {
            const speed = 0.15;
            cursor.x += (cursor.targetX - cursor.x) * speed;
            cursor.y += (cursor.targetY - cursor.y) * speed;
            dom.cursorOutline.style.left = `${cursor.x}px`;
            dom.cursorOutline.style.top = `${cursor.y}px`;
            requestAnimationFrame(animateCursor);
        }
        animateCursor();
        
        document.querySelectorAll('a, button, .paper-card').forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
        });

        document.querySelectorAll('.magnetic-btn').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const r = btn.getBoundingClientRect();
                const x = e.clientX - r.left - r.width/2;
                const y = e.clientY - r.top - r.height/2;
                btn.style.transform = `translate(${x*0.3}px, ${y*0.3}px)`;
            });
            btn.addEventListener('mouseleave', () => btn.style.transform = 'translate(0,0)');
        });

        const frame = document.querySelector('.stego-console');
        const container = document.querySelector('.profile-image-container');
        if(container && frame) {
            container.addEventListener('mousemove', (e) => {
                const rect = container.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -4; 
                const rotateY = ((x - centerX) / centerX) * 4;
                frame.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });
            container.addEventListener('mouseleave', () => {
                frame.style.transform = `perspective(1000px) rotateX(0) rotateY(0)`;
            });
        }

        const scrollBtn = document.getElementById('scrollTop');
        window.addEventListener('scroll', () => {
            const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            dom.progress.style.width = `${(window.scrollY / h) * 100}%`;
            
            if (window.scrollY > 100) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        });
        
        scrollBtn.addEventListener('click', (e) => {
            window.scrollTo({top: 0, behavior: 'smooth'});
            
            const rect = scrollBtn.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            for(let i=0; i<12; i++) {
                createRocketParticle(centerX, centerY);
            }
        });

        function createRocketParticle(x, y) {
            const p = document.createElement('div');
            p.className = 'rocket-particle';
            p.style.left = `${x}px`;
            p.style.top = `${y}px`;
            
            const vx = (Math.random() - 0.5) * 40 + 'px';
            p.style.setProperty('--vx', vx);
            
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 600);
        }

        setupSmartCanvas();
    }

    function initTilt(element) {
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const rx = -((y - cy) / cy) * 3; 
            const ry = ((x - cx) / cx) * 3;
            element.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
        });
        element.addEventListener('mouseleave', () => {
            element.style.transition = 'transform 0.5s ease';
            element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            setTimeout(() => { element.style.transition = ''; }, 500);
        });
    }

    function setupSmartCanvas() {
        const cvs = document.getElementById('neuralCanvas'), ctx = cvs.getContext('2d');
        let w, h, nodes = [];
        const resize = () => { w = cvs.width = window.innerWidth; h = cvs.height = window.innerHeight; };
        window.addEventListener('resize', resize); resize();
        let mouse = { x: null, y: null, radius: 150 };
        window.addEventListener('mousemove', e => { mouse.x = e.x; mouse.y = e.y; });
        window.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

        class Node {
            constructor() { 
                this.x = Math.random()*w; this.y = Math.random()*h; 
                this.vx = (Math.random()-.5)*0.5; this.vy = (Math.random()-.5)*0.5; 
            }
            update() { 
                this.x+=this.vx; this.y+=this.vy; 
                if(this.x<0||this.x>w)this.vx*=-1; if(this.y<0||this.y>h)this.vy*=-1; 
                if (mouse.x) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx*dx + dy*dy);
                    if (distance < mouse.radius) {
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;
                        const force = (mouse.radius - distance) / mouse.radius;
                        this.x -= forceDirectionX * force * 2;
                        this.y -= forceDirectionY * force * 2;
                    }
                }
            }
            draw() { 
                ctx.beginPath(); ctx.arc(this.x,this.y,2,0,Math.PI*2); 
                ctx.fillStyle = state.theme==='dark'?'rgba(255,255,255,0.6)':'rgba(0,0,0,0.5)'; 
                ctx.fill(); 
            }
        }
        
        for(let i=0; i<100; i++) nodes.push(new Node());
        
        (function animate(){
            ctx.clearRect(0,0,w,h);
            const opacityFactor = 0.4;
            nodes.forEach((n, i) => {
                n.update(); n.draw();
                for(let j=i+1; j<nodes.length; j++) {
                    const d = Math.hypot(n.x-nodes[j].x, n.y-nodes[j].y);
                    if(d<150) {
                        ctx.beginPath(); ctx.moveTo(n.x,n.y); ctx.lineTo(nodes[j].x,nodes[j].y);
                        ctx.strokeStyle = state.theme==='dark' ? `rgba(255,255,255,${opacityFactor*(1-d/150)})` : `rgba(0,0,0,${opacityFactor*(1-d/150)})`;
                        ctx.stroke();
                    }
                }
            });
            requestAnimationFrame(animate);
        })();
    }

    function typeWriter(text, element) {
        let i = 0; element.innerHTML = '';
        const interval = setInterval(() => {
            element.innerHTML += text.charAt(i); i++;
            if (i > text.length) clearInterval(interval);
        }, 100);
    }

    function setupSteganography() {
        const btn = document.getElementById('decryptBtn');
        const txt = document.getElementById('secretText');
        const btnText = document.getElementById('btnText'); 
        const frame = document.querySelector('.stego-frame');
        const email = "yjlin.phd@gmail.com";
        const imgEnc = document.querySelector('.encrypted-layer .profile-img');
        const imgDec = document.getElementById('decryptedImg');
        
        let isProcessing = false;
        let isDone = false;
        let isImagesLoaded = false;

        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btnText.innerText = "LOADING ASSETS...";

        function checkImages() {
            if (imgEnc.complete && imgDec.complete) {
                isImagesLoaded = true;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btnText.innerText = "DECRYPT";
                document.querySelector('.console-header').style.borderColor = 'var(--accent)';
            }
        }

        if(imgEnc.complete && imgDec.complete) {
            checkImages();
        } else {
            imgEnc.onload = checkImages;
            imgDec.onload = checkImages;
        }

        btn.addEventListener('click', () => {
            if (isProcessing || isDone || !isImagesLoaded) return;
            isProcessing = true;

            btnText.innerText = "INITIALIZING...";
            
            startAnimation();
        });

        function startAnimation() {
            frame.classList.add('revealing');
            
            btnText.innerText = "PROCESSING...";

            let iter = 0; 
            const duration = 3500; 
            const intervalTime = 40;
            const increment = email.length / (duration / intervalTime);
            
            const timer = setInterval(() => {
                txt.innerText = email.split("").map((l, i) => {
                    if (i < iter) return email[i];
                    return "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"[Math.floor(Math.random() * 36)];
                }).join("");

                if (iter >= email.length) { 
                    clearInterval(timer); 
                    txt.innerText = email; 
                    finish(); 
                }
                iter += increment;
            }, intervalTime);
        }

        function finish() {
            setTimeout(() => {
                document.querySelector('.stego-console').classList.add('decrypted');
                btn.classList.add('success');
                btn.innerHTML = '<i class="fas fa-check-circle"></i> RECOVERED';
                isDone = true;
                isProcessing = false;
            }, 500); 
        }
    }

    function setupTabs() {
        const btns = document.querySelectorAll('.tab-btn'), panes = document.querySelectorAll('.tab-pane');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                panes.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.add('active');
            });
        });
    }

    function updateStaticText() {
        const map = {
            navJournals: {en:"Journal Papers", zh:"期刊论文"}, navConferences: {en:"Conference Papers", zh:"会议论文"},
            navPatents: {en:"Patents", zh:"申请专利"}, navService: {en:"Service", zh:"学术服务"},
            serviceJournal: {en:"Journal Reviewer", zh:"期刊审稿"}, serviceConf: {en:"Conference Reviewer", zh:"会议审稿"}
        };
        document.querySelectorAll('[data-i18n]').forEach(e => e.innerText = map[e.dataset.i18n][state.lang === 'en' ? 'en' : 'zh']);
    }

    function triggerGlobalEffect(type) {
        if (type === 'theme') {
            document.body.classList.add('effect-quantum');
            setTimeout(() => document.body.classList.remove('effect-quantum'), 400);
        } else if (type === 'lang') {
            let scan = document.getElementById('scanOverlay');
            if (!scan) {
                scan = document.createElement('div');
                scan.id = 'scanOverlay';
                scan.className = 'scan-overlay';
                document.body.appendChild(scan);
            }
            scan.classList.remove('effect-scan');
            void scan.offsetWidth;
            scan.classList.add('effect-scan');
        }
    }

    document.getElementById('langBtn').addEventListener('click', () => { 
        triggerGlobalEffect('lang');
        state.lang = state.lang==='en'?'zh':'en'; 
        renderAll(); 
    });

    document.getElementById('themeBtn').addEventListener('click', () => { 
        triggerGlobalEffect('theme');
        state.theme = state.theme==='dark'?'light':'dark'; 
        localStorage.setItem('theme', state.theme); 
        applyTheme(); 
    });

    function applyTheme() { document.body.dataset.theme = state.theme; }
});