import fs from 'fs';

function generateHTML() {
  const newsData = JSON.parse(fs.readFileSync('docs/news-data.json', 'utf8'));
  
  // 페이지당 15개씩 분할
  const articlesPerPage = 15;
  const totalPages = Math.ceil(newsData.articles.length / articlesPerPage);
  
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
            <p>디지털데일리, 한국경제신문, 조선비즈, 매일경제, 연합뉴스IT 주요 기사 ${newsData.articles.length}개</p>
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
                            <th>키워드요약</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentArticles.map((article, index) => `
                            <tr>
                                <td><span class="category">${article.category}</span></td>
                                <td class="title-cell">
                                    <a href="${article.link}" target="_blank" class="news-title-link">
                                        ${article.title}
                                    </a>
                                    <div class="news-date">${new Date(article.publishedAt).
