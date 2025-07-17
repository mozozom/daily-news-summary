import fs from 'fs';

function generateHTML() {
  const newsData = JSON.parse(fs.readFileSync('docs/news-data.json', 'utf8'));
  
  // 페이지당 15개씩 분할
  const articlesPerPage = 15;
  const totalPages = Math.ceil(newsData.articles.length / articlesPerPage);
  
  console.log(`총 ${newsData.articles.length}개 기사, ${totalPages}페이지 생성 예정`);
  
  // 메인 페이지 (첫 번째 페이지)
  generateMainPage(newsData, 1, totalPages);
  
  // 추가 페이지들 생성
  for (let page = 2; page <= totalPages; page++) {
    generatePage(newsData, page, totalPages);
  }
  
  console.log(`✅ 총 ${totalPages}페이지 생성 완료`);
}

function generateMainPage(newsData, currentPage, totalPages) {
  const articlesPerPage = 15;
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const currentArticles = newsData.articles.slice(startIndex, endIndex);
  
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
            <p>한국경제신문, 조선일보, 중앙일보, 이데일리, 뉴스1 주요 기사 ${newsData.articles.length}개</p>
            <div class="last-updated">
                🕐 마지막 업데이트: ${new Date(newsData.lastUpdated).toLocaleString('ko-KR')}
            </div>
        </header>

        <main>
            <div class="table-container">
                <table class="news-table">
                    <thead>
                        <tr>
                            <th>기사분류</th>
                            <th>기사제목</th>
                            <th>소스</th>
                            <th>요약</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateTableRows(currentArticles)}
                    </tbody>
                </table>
            </div>
            
            ${generatePagination(currentPage, totalPages)}
        </main>

        <footer>
            <p>매일 오전 9시에 자동 업데이트됩니다</p>
            <p>Made with ❤️ and Claude AI</p>
        </footer>
    </div>

    ${generateSummaryScript()}
</body>
</html>`;

  fs.writeFileSync('docs/index.html', html);
  console.log('✅ index.html 생성 완료');
}

function generatePage(newsData, currentPage, totalPages) {
  const articlesPerPage = 15;
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const currentArticles = newsData.articles.slice(startIndex, endIndex);
  
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📰 매일 뉴스 요약 - ${currentPage}페이지</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>📰 매일 뉴스 요약</h1>
            <p>한국경제신문, 조선일보, 중앙일보, 이데일리, 뉴스1 주요 기사 ${newsData.articles.length}개</p>
            <div class="last-updated">
                🕐 마지막 업데이트: ${new Date(newsData.lastUpdated).toLocaleString('ko-KR')}
            </div>
            <div class="page-info">
                📄 ${currentPage}페이지 / 총 ${totalPages}페이지
            </div>
        </header>

        <main>
            <div class="table-container">
                <table class="news-table">
                    <thead>
                        <tr>
                            <th>기사분류</th>
                            <th>기사제목</th>
                            <th>소스</th>
                            <th>요약</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateTableRows(currentArticles)}
                    </tbody>
                </table>
            </div>
            
            ${generatePagination(currentPage, totalPages)}
        </main>

        <footer>
            <p>매일 오전 9시에 자동 업데이트됩니다</p>
            <p>Made with ❤️ and Claude AI</p>
        </footer>
    </div>

    ${generateSummaryScript()}
</body>
</html>`;

  fs.writeFileSync(`docs/page-${currentPage}.html`, html);
  console.log(`✅ page-${currentPage}.html 생성 완료`);
}

function generateTableRows(articles) {
  return articles.map((article, index) => {
    const title = article.title.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
    const encodedUrl = encodeURIComponent(article.link);
    
    return `
        <tr>
            <td><span class="category">${article.category}</span></td>
            <td class="title-cell">
                <a href="${article.link}" target="_blank" class="news-title-link">
                    ${title}
                </a>
                <div class="news-date">${new Date(article.publishedAt).toLocaleDateString('ko-KR')}</div>
            </td>
            <td><span class="source">${article.source}</span></td>
            <td class="summary-cell">
                <button class="summary-btn" onclick="generateSummary('${encodedUrl}', this)">
                    📝 요약생성
                </button>
                <div class="summary-content" style="display: none;"></div>
            </td>
        </tr>`;
  }).join('');
}

function generatePagination(currentPage, totalPages) {
  if (totalPages <= 1) return '';
  
  let pagination = '<div class="pagination">';
  
  // 이전 페이지
  if (currentPage > 1) {
    const prevPage = currentPage - 1;
    const prevUrl = prevPage === 1 ? 'index.html' : `page-${prevPage}.html`;
    pagination += `<a href="${prevUrl}" class="page-btn prev">‹ 이전</a>`;
  }
  
  // 페이지 번호
  for (let i = 1; i <= totalPages; i++) {
    const url = i === 1 ? 'index.html' : `page-${i}.html`;
    const activeClass = i === currentPage ? ' active' : '';
    pagination += `<a href="${url}" class="page-btn${activeClass}">${i}</a>`;
  }
  
  // 다음 페이지
  if (currentPage < totalPages) {
    const nextPage = currentPage + 1;
    pagination += `<a href="page-${nextPage}.html" class="page-btn next">다음 ›</a>`;
  }
  
  pagination += '</div>';
  return pagination;
}

function generateSummaryScript() {
  return `
    <script>
        async function generateSummary(encodedUrl, button) {
            const url = decodeURIComponent(encodedUrl);
            const summaryDiv = button.nextElementSibling;
            
            // 이미 요약이 있으면 토글
            if (summaryDiv.innerHTML.trim() && summaryDiv.style.display !== 'none') {
                summaryDiv.style.display = 'none';
                button.textContent = '📝 요약생성';
                button.disabled = false;
                return;
            }
            
            // 로딩 상태
            button.textContent = '⏳ 요약중...';
            button.disabled = true;
            summaryDiv.style.display = 'block';
            summaryDiv.innerHTML = '<p>🤖 AI가 원문을 분석하여 요약을 생성하고 있습니다...</p>';
            
            try {
                // 서버에 요약 요청 (실제로는 Claude API 호출)
                const response = await fetch('/api/summarize', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: url })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    summaryDiv.innerHTML = \`
                        <div class="summary-result">
                            <h4>📄 AI 요약</h4>
                            <p>\${data.summary}</p>
                            <div class="summary-meta">
                                <small>원문의 약 \${data.compressionRate}% 요약</small>
                            </div>
                        </div>
                    \`;
                    button.textContent = '📝 요약닫기';
                } else {
                    throw new Error('요약 생성 실패');
                }
                
            } catch (error) {
                console.error('요약 오류:', error);
                summaryDiv.innerHTML = \`
                    <div class="summary-error">
                        <p>⚠️ 현재 요약 기능을 준비 중입니다.</p>
                        <p>원문 링크를 클릭하여 전체 기사를 확인해주세요.</p>
                    </div>
                \`;
                button.textContent = '📝 요약실패';
                setTimeout(() => {
                    button.textContent = '📝 요약생성';
                    button.disabled = false;
                }, 3000);
            }
            
            button.disabled = false;
        }
    </script>
  `;
}

// 실행
generateHTML();
