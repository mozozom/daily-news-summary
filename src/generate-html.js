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
                                    <button class="summary-btn" onclick="toggleSummary(${index})">
                                        요약보기
                                    </button>
                                    <div class="summary-content" id="summary-${index}" style="display: none;">
                                        ${article.summary}
                                    </div>
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

    <script>
        function toggleSummary(index) {
            const summaryDiv = document.getElementById('summary-' + index);
            const button = summaryDiv.previousElementSibling;
            
            if (summaryDiv.style.display === 'none') {
                summaryDiv.style.display = 'block';
                button.textContent = '요약닫기';
            } else {
                summaryDiv.style.display = 'none';
                button.textContent = '요약보기';
            }
        }
    </script>
</body>
</html>`;

  fs.writeFileSync('docs/index.html', html);
  console.log('✅ HTML 생성 완료');
}

generateHTML();
