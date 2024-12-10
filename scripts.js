document.getElementById('toggle-language').addEventListener('click', function () {
    const currentLanguage = this.textContent === '中文' ? 'en' : 'zh';
    document.querySelectorAll('[data-lang]').forEach(elem => {
        elem.style.display = elem.getAttribute('data-lang') === currentLanguage ? 'block' : 'none';
    });
    this.textContent = currentLanguage === 'en' ? '中文' : 'English';
});

// Initialize the language to English
document.querySelectorAll('[data-lang]').forEach(elem => {
    elem.style.display = elem.getAttribute('data-lang') === 'en' ? 'block' : 'none';
});
