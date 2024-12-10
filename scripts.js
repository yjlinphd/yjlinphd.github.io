// Switch language function
function switchLanguage(lang) {
    const title = document.getElementById('welcome-title');
    if (lang === 'en') {
        title.textContent = 'Welcome to My Academic Profile';
    } else if (lang === 'zh') {
        title.textContent = '欢迎来到我的学术主页';
    } else if (lang === 'zh-tw') {
        title.textContent = '歡迎來到我的學術主頁';
    }
}

// Loading animation
window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loading-screen');
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 1000);
    }, 2000);
});

// Particle background
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];
class Particle {
    constructor(x, y, size, color, velocity) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.velocity = velocity;
    }
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        if (this.size > 0.1) this.size -= 0.02;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

function initParticles() {
    particlesArray = [];
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 5 + 1;
        const color = 'rgba(255,255,255,0.8)';
        const velocity = { x: Math.random() - 0.5, y: Math.random() - 0.5 };
        particlesArray.push(new Particle(x, y, size, color, velocity));
    }
}

function handleParticles() {
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
        if (particlesArray[i].size <= 0.2) {
            particlesArray.splice(i, 1);
            i--;
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    handleParticles();
    requestAnimationFrame(animate);
}

initParticles();
animate();

// Mouse trail
document.body.addEventListener('mousemove', (e) => {
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    trail.style.left = `${e.pageX}px`;
    trail.style.top = `${e.pageY}px`;
    document.body.appendChild(trail);
    setTimeout(() => trail.remove(), 1000);
});
