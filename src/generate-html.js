import fs from 'fs';

function generateHTML() {
  const newsData = JSON.parse(fs.readFileSync('docs/news-data.json', 'utf8'));
  
  // 메인 페이지 HTML 생성
  const mainHtml = `<!DOCTYPE html>
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
            <p>디지털데일리, 한국경제신문, 조선비즈 주요 기사 50개</p>
            <div class="last-updated">
                🕐 마지막 업데이트: ${new Date(newsData.lastUpdated).toLocaleString('ko-KR')}
            </div>
        </header>

        <main>
            <div class="table-container">
                <table class="news-table">
                    <thead>
                        <tr>
                            <th>분류</th>
                            <th>기사제목</th>
                            <th>소스</th>
                            <th>요약보기</th>
                            <th>원문보기</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${newsData.articles.map((article, index) => `
                            <tr>
                                <td><span class="category">${article.category}</span></td>
                                <td class="title-cell">
                                    <div class="news-title">${article.title}</div>
                                    <div class="news-date">${new Date(article.publishedAt).toLocaleDateString('ko-KR')}</div>
                                </td>
                                <td><span class="source">${article.source}</span></td>
                                <td>
                                    <a href="summary-${index}.html" class="summary-btn">
                                        요약보기
                                    </a>
                                </td>
                                <td>
                                    <a href="${article.link}" target="_blank" class="original-link">
                                        원문보기
                                    </a>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </main>

        <footer>
            <p>매일 오전 9시에 자동 업데이트됩니다</p>
            <p>Made with ❤️ and Claude AI</p>
        </footer>
    </div>
</body>
</html>`;

  // 각 기사별 요약 페이지 생성
  newsData.articles.forEach((article, index) => {
    const summaryHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📰 뉴스 요약 - ${article.title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <div class="summary-page">
            <div class="summary-header">
                <a href="index.html" class="home-btn">🏠 홈으로 돌아가기</a>
                <div class="article-meta">
                    <span class="source">${article.source}</span>
                    <span class="category">${article.category}</span>
                    <span class="date">${new Date(article.publishedAt).toLocaleDateString('ko-KR')}</span>
                </div>
            </div>

            <div class="summary-content-page">
                <h1 class="article-title">${article.title}</h1>
                
                <div class="summary-box">
                    <h2>📋 AI 요약</h2>
                    <div class="summary-text">
                        ${article.summary.split('\n').map(line => `<p>${line}</p>`).join('')}
                    </div>
                </div>

                <div class="action-buttons">
                    <a href="${article.link}" target="_blank" class="original-btn">
                        📄 원문 전체 보기
                    </a>
                    <a href="index.html" class="home-btn-bottom">
                        🏠 홈으로 돌아가기
                    </a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(`docs/summary-${index}.html`, summaryHtml);
  });

  fs.writeFileSync('docs/index.html', mainHtml);
  console.log('✅ 메인 페이지 및 요약 페이지들 생성 완료');
}

generateHTML();
