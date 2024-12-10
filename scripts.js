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

// 加载论文 JSON 文件
fetch('papers.json')
    .then(response => response.json())
    .then(data => {
        const papers = data.papers;
        const container = document.getElementById('papers-container');

        // 动态生成论文条目
        papers.forEach(paper => {
            const paperItem = document.createElement('div');
            paperItem.classList.add('paper-item');
            paperItem.innerHTML = `
                <h3 class="paper-title">${paper.title}</h3>
                <p class="paper-authors">${paper.authors}</p>
                <p class="paper-journal">${paper.journal} - <span class="paper-date">${paper.date}</span></p>
                <p class="paper-description">${paper.description}</p>
            `;
            container.appendChild(paperItem);

            // 点击显示更多
            paperItem.addEventListener('click', function() {
                const description = paperItem.querySelector('.paper-description');
                description.style.display = description.style.display === 'none' ? 'block' : 'none';
            });
        });
    })
    .catch(error => {
        console.error('Error loading papers:', error);
    });
