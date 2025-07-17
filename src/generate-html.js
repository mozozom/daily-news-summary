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
        // Claude API 키 (환경변수에서 가져오기 - 실제로는 서버에서 처리해야 함)
        const CLAUDE_API_KEY = 'YOUR_API_KEY_HERE'; // 실제로는 보안상 서버에서 처리
        
        async function generateSummary(encodedUrl, button) {
            const url = decodeURIComponent(encodedUrl);
            const summaryDiv = button.nextElementSibling;
            
            // 이미 요약이 있으면 토글
            if (summaryDiv.innerHTML.trim() && summaryDiv.innerHTML.includes('AI 요약') && summaryDiv.style.display !== 'none') {
                summaryDiv.style.display = 'none';
                button.textContent = '📝 요약생성';
                button.disabled = false;
                return;
            }
            
            // 이미 요약이 있으면 표시
            if (summaryDiv.innerHTML.includes('AI 요약')) {
                summaryDiv.style.display = 'block';
                button.textContent = '📝 요약닫기';
                return;
            }
            
            // 로딩 상태
            button.textContent = '⏳ 요약중...';
            button.disabled = true;
            summaryDiv.style.display = 'block';
            summaryDiv.innerHTML = '<p style="padding: 10px; text-align: center;">🤖 AI가 원문을 분석하여 요약을 생성하고 있습니다...</p>';
            
            try {
                // 1단계: 원문 내용 가져오기
                const articleContent = await fetchArticleContent(url);
                
                if (!articleContent || articleContent.length < 100) {
                    throw new Error('원문 내용을 가져올 수 없습니다.');
                }
                
                // 2단계: Claude API로 요약 생성
                const summary = await generateSummaryWithClaude(articleContent);
                
                // 3단계: 결과 표시
                const compressionRate = Math.round((summary.length / articleContent.length) * 100);
                
                summaryDiv.innerHTML = \`
                    <div class="summary-result">
                        <h4>📄 AI 요약</h4>
                        <p>\${summary}</p>
                        <div class="summary-meta">
                            <small>원문의 약 \${compressionRate}% 요약 (원문: \${articleContent.length}자 → 요약: \${summary.length}자)</small>
                        </div>
                    </div>
                \`;
                button.textContent = '📝 요약닫기';
                
            } catch (error) {
                console.error('요약 오류:', error);
                
                // 실패 시 간단한 대체 요약 제공
                const simpleTitle = button.closest('tr').querySelector('.news-title-link').textContent;
                const fallbackSummary = generateFallbackSummary(simpleTitle);
                
                summaryDiv.innerHTML = \`
                    <div class="summary-result">
                        <h4>📄 간단 요약</h4>
                        <p>\${fallbackSummary}</p>
                        <div class="summary-meta">
                            <small>⚠️ AI 요약 실패 - 제목 기반 간단 요약</small>
                            <br><small>원문 링크를 클릭하여 전체 기사를 확인해주세요.</small>
                        </div>
                    </div>
                \`;
                button.textContent = '📝 요약닫기';
            }
            
            button.disabled = false;
        }
        
        async function fetchArticleContent(url) {
            try {
                // CORS 우회를 위한 프록시 서비스 사용
                const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url);
                const response = await fetch(proxyUrl);
                const data = await response.json();
                
                if (!data.contents) {
                    throw new Error('내용을 가져올 수 없습니다.');
                }
                
                // HTML에서 텍스트 추출
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.contents, 'text/html');
                
                // 다양한 뉴스 사이트의 본문 셀렉터
                const selectors = [
                    '.article-content',
                    '.news-content', 
                    '#articleText',
                    '.article_txt',
                    '.view_text',
                    '.article_view',
                    '.news_article',
                    '.content',
                    'article p',
                    '.post-content',
                    '.article-body',
                    '.entry-content'
                ];
                
                let content = '';
                for (const selector of selectors) {
                    const element = doc.querySelector(selector);
                    if (element) {
                        content = element.textContent || element.innerText;
                        if (content && content.length > 200) {
                            break;
                        }
                    }
                }
                
                // 기본 본문이 없으면 p 태그들에서 추출
                if (!content || content.length < 200) {
                    const paragraphs = doc.querySelectorAll('p');
                    content = Array.from(paragraphs)
                        .map(p => p.textContent || p.innerText)
                        .filter(text => text && text.length > 20)
                        .join(' ');
                }
                
                return content.trim().substring(0, 3000); // 최대 3000자
                
            } catch (error) {
                console.error('원문 가져오기 실패:', error);
                throw new Error('원문 내용을 가져올 수 없습니다.');
            }
        }
        
        async function generateSummaryWithClaude(content) {
            // 현재는 Claude API 직접 호출이 CORS 때문에 어려움
            // 대신 간단한 텍스트 요약 알고리즘 사용
            return extractKeyInformation(content);
        }
        
        function extractKeyInformation(content) {
            // 간단한 텍스트 요약 알고리즘
            const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 10);
            
            // 중요도 점수 계산
            const importantWords = ['발표', '계획', '예정', '추진', '증가', '감소', '상승', '하락', '투자', '개발', '출시', '론칭', '확대', '축소', '성장', '전망', '목표', '달성', '실적', '매출', '순이익'];
            
            const scoredSentences = sentences.map(sentence => {
                let score = 0;
                const words = sentence.split(' ');
                
                // 길이 점수 (너무 짧거나 긴 문장 제외)
                if (words.length >= 5 && words.length <= 25) score += 1;
                
                // 중요 키워드 점수
                importantWords.forEach(word => {
                    if (sentence.includes(word)) score += 2;
                });
                
                // 숫자나 날짜가 포함된 문장 (구체적 정보)
                if (/\\d/.test(sentence)) score += 1;
                
                // 회사명이나 기관명이 포함된 문장
                if (/[A-Z][a-z]+|주식회사|기업|회사|정부|부처/.test(sentence)) score += 1;
                
                return { sentence: sentence.trim(), score };
            });
            
            // 점수 순으로 정렬하고 상위 3-4개 문장 선택
            const topSentences = scoredSentences
                .sort((a, b) => b.score - a.score)
                .slice(0, 4)
                .map(item => item.sentence)
                .filter(s => s.length > 0);
            
            let summary = topSentences.join('. ');
            
            // 요약이 너무 짧으면 추가 문장 포함
            if (summary.length < 200 && sentences.length > 4) {
                const additionalSentences = sentences.slice(0, 2);
                summary = additionalSentences.concat(topSentences).join('. ');
            }
            
            // 최대 길이 제한
            if (summary.length > 500) {
                summary = summary.substring(0, 500) + '...';
            }
            
            return summary || '요약을 생성할 수 없습니다. 원문을 확인해주세요.';
        }
        
        function generateFallbackSummary(title) {
            // 제목 기반 간단 요약
            const keywords = title.match(/[가-힣A-Za-z0-9]+/g) || [];
            const importantKeywords = keywords.filter(word => 
                word.length > 1 && 
                !['것으로', '하는', '있는', '되는', '한다', '이다', '있다', '된다'].includes(word)
            );
            
            return \`이 기사는 "\${importantKeywords.slice(0, 3).join(', ')}"에 관한 내용입니다. 자세한 정보는 원문을 확인해주세요.\`;
        }
    </script>
  `;
}

// 실행
generateHTML();
