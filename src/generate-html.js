import fs from 'fs';

function generateHTML() {
  const newsData = JSON.parse(fs.readFileSync('docs/news-data.json', 'utf8'));
  
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📰 매일 뉴스 요약</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>📰 매일 뉴스 요약</h1>
            <p>디지털데일리 주요 기사를 AI가 요약해드립니다</p>
            <div class="last-updated">
                🕐 마지막 업데이트: ${new Date(newsData.lastUpdated).toLocaleString('ko-KR')}
            </div>
        </header>

        <main>
            ${newsData.articles.map(article => `
                <article class="news-item">
                    <div class="news-header">
                        <h2>${article.title}</h2>
                        <span class="category">${article.category}</span>
                        <time>${new Date(article.publishedAt).toLocaleDateString('ko-KR')}</time>
                    </div>
                    
                    <div class="summary-box">
                        <div class="summary-content">
                            ${article.summary.split('\n').map(line => `<div class="summary-line">${line}</div>`).join('')}
                        </div>
                    </div>
                    
                    <div class="content-preview">
                        ${article.content}
                    </div>
                    
                    <div class="news-footer">
                        <a href="${article.link}" target="_blank" class="read-more">
                            전문 보기 →
                        </a>
                    </div>
                </article>
            `).join('')}
        </main>

        <footer>
            <p>매일 오전 9시에 자동 업데이트됩니다</p>
            <p>Made with ❤️ and Claude AI</p>
        </footer>
    </div>
</body>
</html>`;

  fs.writeFileSync('docs/index.html', html);
  console.log('✅ HTML 생성 완료');
}

generateHTML();
