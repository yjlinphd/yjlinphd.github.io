document.addEventListener("DOMContentLoaded", () => {
    const state = { lang: getInitialLanguage(), theme: localStorage.getItem('theme') || 'dark', data: {} };
    const dom = {
        title: document.getElementById('typingTitle'),
        bio: document.getElementById('bioContent'),
        journals: document.getElementById('journalList'),
        conferences: document.getElementById('confList'),
        patents: document.getElementById('patentList'),
        projects: document.getElementById('projectList'),
        sJournal: document.getElementById('serviceJournalList'),
        sConf: document.getElementById('serviceConfList'),
        cursorDot: document.getElementById('cursorDot'),
        cursorOutline: document.getElementById('cursorOutline'),
        progress: document.getElementById('scrollProgress')
    };

    const cursor = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const mouseEffects = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');

    init();

    function getInitialLanguage() {
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage === 'en' || savedLanguage === 'zh') return savedLanguage;

        const preferences = navigator.languages?.length ? navigator.languages : [navigator.language];
        const supportedLanguage = preferences.find(language => /^(zh|en)(-|$)/i.test(language));
        return /^zh(-|$)/i.test(supportedLanguage ?? '') ? 'zh' : 'en';
    }

    async function init() {
        applyTheme();
        playOpening();
        await loadData();
        if (state.data.profile) {
            const { en, zh_Hans } = state.data.profile.intro;
            dom.bio.innerHTML = `
                <div class="bio-text" lang="en">${en}</div>
                <div class="bio-text" lang="zh-Hans">${zh_Hans}</div>
            `;
        }
        renderAll();
        setupEffects();
        setupTabs();
        setupSteganography();
        setupClickEffects();
        typeWriter("Yijie Lin（林翼洁）", dom.title);
    }

    function playOpening() {
        const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
        const opening = document.createElement('dialog');
        opening.className = 'site-opening';
        opening.setAttribute('aria-labelledby', 'openingTitle');
        opening.setAttribute('aria-describedby', 'openingHint');
        const zh = state.lang === 'zh';
        opening.innerHTML = `
            <div class="opening-scene">
                <div class="opening-orbits" aria-hidden="true"><i></i><i></i><i></i></div>
                <div class="opening-mark">
                    <p class="opening-status"><span aria-hidden="true"></span>${zh ? '信号已锁定' : 'SIGNAL LOCKED'}</p>
                    <h1 id="openingTitle" lang="en">Yijie Lin</h1>
                    <p class="opening-subtitle" lang="en">Academic Profile</p>
                    <button class="opening-enter" autofocus>${zh ? '进入主页' : 'Enter Profile'} <span aria-hidden="true">→</span></button>
                    <p id="openingHint" ${reducedMotion.matches ? 'hidden' : ''}>${zh ? '轻触空白处，发射信号' : 'Tap the field to send a pulse'}</p>
                </div>
            </div>
            <div class="opening-scan" aria-hidden="true"></div>
        `;
        document.body.appendChild(opening);
        const enter = opening.querySelector('.opening-enter');
        opening.addEventListener('cancel', event => event.preventDefault());
        opening.addEventListener('pointermove', event => {
            event.stopPropagation();
            if (reducedMotion.matches || event.pointerType !== 'mouse') return;
            opening.style.setProperty('--opening-x', `${event.clientX}px`);
            opening.style.setProperty('--opening-y', `${event.clientY}px`);
        });
        opening.addEventListener('click', event => {
            event.stopPropagation();
            if (reducedMotion.matches || enter.contains(event.target) || opening.classList.contains('is-entering')) return;
            const pulses = opening.querySelectorAll('.opening-pulse');
            if (pulses.length >= 8) pulses[0].remove();
            const pulse = document.createElement('span');
            pulse.className = 'opening-pulse';
            pulse.setAttribute('aria-hidden', 'true');
            pulse.style.left = `${event.clientX}px`;
            pulse.style.top = `${event.clientY}px`;
            opening.appendChild(pulse);
            pulse.addEventListener('animationend', () => pulse.remove(), { once: true });
        });
        enter.addEventListener('click', () => {
            if (opening.classList.contains('is-entering')) return;
            if (reducedMotion.matches) {
                finish();
                return;
            }
            opening.classList.add('is-entering');
            const reveal = opening.getAnimations().find(animation => animation.animationName === 'opening-reveal');
            if (reveal) reveal.finished.then(finish, finish);
            else finish();
        });
        opening.showModal();

        function finish() {
            opening.close();
            opening.remove();
            document.querySelector('.tab-btn.active').focus({ preventScroll: true });
        }
    }

    async function loadData() {
        try {
            const [profile, journals, conferences, patents, service, projects] = await Promise.all([
                fetch('data/profile.json').then(r => r.json()),
                fetch('data/journals.json').then(r => r.json()),
                fetch('data/conferences.json').then(r => r.json()),
                fetch('data/patents.json').then(r => r.json()),
                fetch('data/service.json').then(r => r.json()),
                fetch('data/projects.json').then(r => r.json()).catch(() => [])
            ]);
            state.data = { profile, journals, conferences, patents, service, projects };
        } catch (e) {
            console.error(e);
            dom.bio.innerHTML = "<span style='color:red'>Data load failed. Please use Live Server.</span>";
        }
    }

    function renderAll() {
        if (!state.data.profile) return;

        renderList(state.data.journals, dom.journals, true);
        renderList(state.data.conferences, dom.conferences, true);
        renderPatents(state.data.patents);
        renderProjects(state.data.projects);
        renderService(state.data.service);
        updateStaticText();
    }

    function renderRankingTags(tags = []) {
        const zones = { 1: '一', 2: '二', 3: '三', 4: '四' };
        return tags.map(tag => {
            const label = state.lang === 'en' ? tag : tag
                .replace(/^JCR Q([1-4])$/, (_, zone) => `JCR${zones[zone]}区`)
                .replace(/^CAS T([1-4])( TOP)?$/, (_, zone, top) => `中科院${zones[zone]}区${top ?? ''}`);
            return `<span class="tag" data-type="${tag}">${label}</span>`;
        }).join('');
    }

    function renderList(data, container, showIndex) {
        container.innerHTML = '';
        if (!data) return;
        const sortedData = [...data].sort((a, b) => (b.id || 0) - (a.id || 0));

        sortedData.forEach((p, idx) => {
            const card = document.createElement('div');
            card.className = 'paper-card tilt-card record-card publication-card';
            card.style.animationDelay = `${idx * 100}ms`;

            const authors = p.authors.replace(/(Yijie Lin|林翼洁)/g, '<strong class="record-person">$1</strong>');
            const tags = renderRankingTags(p.tags);

            let publicationInfo = p.journal || p.conference;
            const parts = [];
            if (p.volume) parts.push(`Vol. ${p.volume}`);
            if (p.issue) parts.push(`No. ${p.issue}`);
            if (p.articleId) parts.push(`Article ${p.articleId}`);
            if (p.pages) parts.push(`pp. ${p.pages}`);
            if (p.year) parts.push(`${p.year}`);
            if (parts.length > 0) publicationInfo += `, ${parts.join(', ')}`;

            let linksHtml = '';
            if (p.links) {
                if (p.links.doi) linksHtml += `<a class="paper-link" href="${p.links.doi}" target="_blank"><i class="fas fa-link"></i> DOI</a>`;
                if (p.links.pdf) linksHtml += `<a class="paper-link" href="${p.links.pdf}" target="_blank"><i class="fas fa-file-pdf"></i> PDF</a>`;
            }

            const indexHtml = showIndex ? `<span class="index-num">#${idx + 1}</span>` : '';

            card.innerHTML = `
                <h3 class="paper-title">${indexHtml}${p.title}</h3>
                <div class="record-detail">
                    <div>${authors}</div>
                    <div class="publication-venue">${publicationInfo}</div>
                </div>
                ${tags ? `<div class="record-tags">${tags}</div>` : ''}
                ${linksHtml ? `<div class="paper-links">${linksHtml}</div>` : ''}
            `;
            container.appendChild(card);
            initTilt(card);
        });
    }

    function renderPatents(data) {
        dom.patents.innerHTML = '';
        if (!data) return;
        const isEnglish = state.lang === 'en';
        data.forEach((p, idx) => {
            const card = document.createElement('div');
            card.className = 'paper-card tilt-card record-card';
            card.style.animationDelay = `${idx * 100}ms`;

            const title = isEnglish ? p.titleEn ?? p.title : p.title;
            const names = isEnglish ? p.authorsEn ?? p.authors : p.authors;
            const authors = (names ?? '').replace(/(Yijie Lin|林翼洁)/g, '<strong class="record-person">$1</strong>');
            const statusLabels = { '实质审查': 'Substantive Examination', '发明授权': 'Granted' };
            const status = isEnglish ? statusLabels[p.status] ?? p.status : p.status;

            card.innerHTML = `
                <h3 class="paper-title">${title}</h3>
                <div class="record-meta">
                    ${p.id ? `<span class="record-id">${p.id}</span>` : ''}
                    ${status ? `<span class="tag" data-status="${p.status}">${status}</span>` : ''}
                </div>
                ${authors ? `<div class="record-detail"><div><span class="record-label">${isEnglish ? 'Inventors' : '发明人'}</span> ${authors}</div></div>` : ''}
            `;

            dom.patents.appendChild(card);
            initTilt(card);
        });
    }

    function renderProjects(data) {
        dom.projects.innerHTML = '';
        if (!data || data.length === 0) return;

        const isEnglish = state.lang === 'en';
        const sponsorLabel = isEnglish ? 'Sponsor' : '机构';
        const idLabel = isEnglish ? 'No.' : '编号';
        const amountLabel = isEnglish ? 'Funding' : '经费';
        const periodLabel = isEnglish ? 'Period' : '期间';

        data.forEach((p, idx) => {
            const card = document.createElement('div');
            card.className = 'paper-card tilt-card record-card';
            card.style.animationDelay = `${idx * 100}ms`;

            const title = isEnglish ? p.titleEn ?? p.title : p.title;
            const role = isEnglish ? p.roleEn ?? p.role : p.role;
            const amount = isEnglish ? p.amountEn ?? p.amount : p.amount;
            const roles = Array.isArray(role) ? role : [role].filter(Boolean);
            const roleTags = roles.map(label => `<span class="tag">${label}</span>`).join('');

            card.innerHTML = `
                <h3 class="paper-title">${title}</h3>
                ${roleTags ? `<div class="record-tags">${roleTags}</div>` : ''}
                <div class="record-detail">
                    ${p.sponsor ? `<div><span class="record-label">${sponsorLabel}</span> ${p.sponsor}</div>` : ''}
                    ${p.id ? `<div><span class="record-label">${idLabel}</span> ${p.id}</div>` : ''}
                    ${amount ? `<div><span class="record-label">${amountLabel}</span> ${amount}</div>` : ''}
                    ${p.period ? `<div><span class="record-label">${periodLabel}</span> ${p.period}</div>` : ''}
                </div>
            `;

            dom.projects.appendChild(card);
            initTilt(card);
        });
    }

    function renderService(data) {
        const fill = (list, target) => {
            target.innerHTML = '';
            if (!list) return;
            list.forEach((i, idx) => {
                const li = document.createElement('li');
                li.style.animation = `fadeSlideUpStagger 0.5s ease forwards ${idx * 50}ms`;
                li.style.opacity = '0';
                const tags = renderRankingTags(i.tags);
                li.innerHTML = `<span>${i.name}</span>${tags ? `<div class="service-tags">${tags}</div>` : ''}`;
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
        document.addEventListener('pointermove', (e) => {
            if (!mouseEffects.matches || e.pointerType !== 'mouse') return;
            cursor.targetX = e.clientX;
            cursor.targetY = e.clientY;
            dom.cursorDot.style.left = `${e.clientX}px`;
            dom.cursorDot.style.top = `${e.clientY}px`;
            if (!document.body.classList.contains('custom-cursor')) {
                cursor.x = cursor.targetX;
                cursor.y = cursor.targetY;
                document.body.classList.add('custom-cursor');
                animateCursor();
            }
        });

        function animateCursor() {
            if (!mouseEffects.matches) {
                document.body.classList.remove('custom-cursor');
                return;
            }
            const speed = 0.15;
            cursor.x += (cursor.targetX - cursor.x) * speed;
            cursor.y += (cursor.targetY - cursor.y) * speed;
            dom.cursorOutline.style.left = `${cursor.x}px`;
            dom.cursorOutline.style.top = `${cursor.y}px`;
            requestAnimationFrame(animateCursor);
        }

        document.querySelectorAll('a, button, .paper-card').forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
        });

        document.querySelectorAll('.magnetic-btn').forEach(btn => {
            btn.addEventListener('pointermove', (e) => {
                if (!mouseEffects.matches || e.pointerType !== 'mouse') return;
                const r = btn.getBoundingClientRect();
                const x = e.clientX - r.left - r.width / 2;
                const y = e.clientY - r.top - r.height / 2;
                btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
            });
            btn.addEventListener('mouseleave', () => btn.style.transform = 'translate(0,0)');
        });

        const frame = document.querySelector('.stego-console');
        const container = document.querySelector('.profile-image-container');
        if (container && frame) {
            container.addEventListener('pointermove', (e) => {
                if (!mouseEffects.matches || e.pointerType !== 'mouse') return;
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
            window.scrollTo({ top: 0, behavior: 'smooth' });

            const rect = scrollBtn.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            for (let i = 0; i < 12; i++) {
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
        element.addEventListener('pointermove', (e) => {
            if (!mouseEffects.matches || e.pointerType !== 'mouse') return;
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
                this.x = Math.random() * w; this.y = Math.random() * h;
                this.vx = (Math.random() - .5) * 0.5; this.vy = (Math.random() - .5) * 0.5;
            }
            update() {
                this.x += this.vx; this.y += this.vy;
                if (this.x < 0 || this.x > w) this.vx *= -1; if (this.y < 0 || this.y > h) this.vy *= -1;
                if (mouse.x) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
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
                ctx.beginPath(); ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = state.theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
                ctx.fill();
            }
        }

        for (let i = 0; i < 100; i++) nodes.push(new Node());

        (function animate() {
            ctx.clearRect(0, 0, w, h);
            const opacityFactor = 0.4;
            nodes.forEach((n, i) => {
                n.update(); n.draw();
                for (let j = i + 1; j < nodes.length; j++) {
                    const d = Math.hypot(n.x - nodes[j].x, n.y - nodes[j].y);
                    if (d < 150) {
                        ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.strokeStyle = state.theme === 'dark' ? `rgba(255,255,255,${opacityFactor * (1 - d / 150)})` : `rgba(0,0,0,${opacityFactor * (1 - d / 150)})`;
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

        if (imgEnc.complete && imgDec.complete) {
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
        const navigation = document.querySelector('.tab-navigation');
        const btns = navigation.querySelectorAll('.tab-btn');
        const panes = document.querySelectorAll('.tab-pane');
        const indicator = document.createElement('span');
        indicator.className = 'tab-indicator';
        indicator.setAttribute('aria-hidden', 'true');
        navigation.prepend(indicator);
        const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
        let active = navigation.querySelector('.tab-btn.active');
        let animation;

        function placeIndicator(btn) {
            indicator.style.width = `${btn.offsetWidth}px`;
            indicator.style.height = `${btn.offsetHeight}px`;
            indicator.style.transform = `translate(${btn.offsetLeft}px, ${btn.offsetTop}px)`;
        }

        placeIndicator(active);
        navigation.classList.add('has-tab-indicator');
        new ResizeObserver(() => placeIndicator(active)).observe(navigation);
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn === active) return;
                const sameRow = active.offsetTop === btn.offsetTop;
                const previousTransform = getComputedStyle(indicator).transform;
                animation?.cancel();
                btns.forEach(b => b.classList.remove('active'));
                panes.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.add('active');
                active = btn;
                placeIndicator(btn);
                indicator.classList.remove('is-travelling');
                if (!reducedMotion.matches) {
                    void indicator.offsetWidth;
                    indicator.classList.add('is-travelling');
                    const frames = sameRow
                        ? [{ transform: previousTransform }, { transform: indicator.style.transform }]
                        : [{ opacity: 0 }, { opacity: 1 }];
                    animation = indicator.animate(frames, { duration: sameRow ? 240 : 160, easing: 'ease-out' });
                }
            });
        });
    }

    function updateStaticText() {
        document.documentElement.lang = state.lang === 'en' ? 'en' : 'zh-Hans';
        const map = {
            navAbout: { en: "Biography", zh: "个人简介" },
            navJournals: { en: "Journal Papers", zh: "期刊论文" },
            navConferences: { en: "Conference Papers", zh: "会议论文" },
            navPatents: { en: "Patents", zh: "申请专利" },
            navProjects: { en: "Projects", zh: "科研项目" },
            navService: { en: "Service", zh: "学术服务" },
            serviceJournal: { en: "Journal Reviewer", zh: "期刊审稿" },
            serviceConf: { en: "Conference Reviewer", zh: "会议审稿" }
        };
        document.querySelectorAll('[data-i18n]').forEach(e => e.innerText = map[e.dataset.i18n][state.lang === 'en' ? 'en' : 'zh']);
    }

    document.getElementById('langBtn').addEventListener('click', () => {
        let scan = document.getElementById('scanOverlay');
        if (!scan) {
            scan = document.createElement('div');
            scan.id = 'scanOverlay';
            scan.className = 'scan-overlay';
            scan.setAttribute('aria-hidden', 'true');
            document.body.appendChild(scan);
        }
        scan.classList.remove('effect-scan');
        void scan.offsetWidth;
        scan.classList.add('effect-scan');

        document.body.classList.add('language-changed');
        state.lang = state.lang === 'en' ? 'zh' : 'en';
        localStorage.setItem('language', state.lang);
        renderAll();
    });

    document.getElementById('themeBtn').addEventListener('click', () => {
        document.body.classList.add('effect-quantum');
        setTimeout(() => document.body.classList.remove('effect-quantum'), 400);
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', state.theme);
        applyTheme();
    });

    function applyTheme() { document.body.dataset.theme = state.theme; }
});
