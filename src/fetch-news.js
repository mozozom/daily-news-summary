import fetch from 'node-fetch';
import Parser from 'rss-parser';
import fs from 'fs';

const parser = new Parser();

async function fetchMultipleNews() {
  try {
    console.log('📰 뉴스 수집 시작...');
    
    const allArticles = [];
    
    // 1. 한국경제신문
    console.log('🔍 한국경제신문 수집 중...');
    const hankyungArticles = await fetchRSS('https://www.hankyung.com/feed/all-news', '한국경제신문', '경제', 20);
    allArticles.push(...hankyungArticles);

    // 2. 조선일보 경제
    console.log('🔍 조선일보 수집 중...');
    const chosunArticles = await fetchRSS('https://www.chosun.com/arc/outboundfeeds/rss/category/economy/?outputType=xml', '조선일보', '경제', 15);
    allArticles.push(...chosunArticles);

    // 3. 중앙일보 경제
    console.log('🔍 중앙일보 수집 중...');
    const joongang = await fetchRSS('https://rss.joins.com/joins_money_list.xml', '중앙일보', '경제', 15);
    allArticles.push(...joongang);

    // 4. 이데일리
    console.log('🔍 이데일리 수집 중...');
    const edaily = await fetchRSS('https://www.edaily.co.kr/rss/edaily_news.xml', '이데일리', 'IT/경제', 15);
    allArticles.push(...edaily);

    // 5. 뉴스1 경제
    console.log('🔍 뉴스1 수집 중...');
    const news1 = await fetchRSS('https://www.news1.kr/rss/S1N4.xml', '뉴스1', '경제', 10);
    allArticles.push(...news1);

    // 발행시간 순으로 정렬 (최신순)
    allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // 50개로 제한
    const finalArticles = allArticles.slice(0, 50);

    console.log(`📊 총 ${finalArticles.length}개 기사 수집 완료`);

    // JSON 파일로 저장
    const newsData = {
      lastUpdated: new Date().toISOString(),
      articles: finalArticles
    };
    
    fs.writeFileSync('docs/news-data.json', JSON.stringify(newsData, null, 2));
    console.log('✅ 뉴스 데이터 저장 완료');
    
  } catch (error) {
    console.error('❌ 뉴스 수집 실패:', error);
    process.exit(1);
  }
}

async function fetchRSS(url, sourceName, category, maxCount) {
  try {
    console.log(`📡 ${sourceName} RSS 연결 시도: ${url}`);
    const feed = await parser.parseURL(url);
    const articles = [];
    
    const itemCount = Math.min(feed.items.length, maxCount);
    console.log(`📰 ${sourceName}: ${itemCount}개 기사 발견`);
    
    for (let i = 0; i < itemCount; i++) {
      const item = feed.items[i];
      
      if (item.title && item.link) {
        articles.push({
          id: `${sourceName}-${Date.now()}-${i}`,
          title: item.title.trim(),
          link: item.link,
          source: sourceName,
          category: category,
          publishedAt: item.pubDate || new Date().toISOString(),
          summary: null // 키워드 요약 제거
        });
      }
    }
    
    console.log(`✅ ${sourceName}: ${articles.length}개 기사 수집 완료`);
    return articles;
    
  } catch (error) {
    console.error(`❌ ${sourceName} 수집 실패:`, error.message);
    return [];
  }
}

// 실행
fetchMultipleNews();
