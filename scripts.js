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

// Mouse cursor animation
document.body.addEventListener('mousemove', (e) => {
    const cursor = document.querySelector('.cursor');
    cursor.style.left = `${e.pageX}px`;
    cursor.style.top = `${e.pageY}px`;
});
