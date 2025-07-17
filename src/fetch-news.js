import fetch from 'node-fetch';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import fs from 'fs';

const parser = new Parser();
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

async function fetchMultipleNews() {
  try {
    console.log('📰 뉴스 수집 시작...');
    
    const allArticles = [];
    
    // 1. 디지털데일리 웹 스크래핑
    console.log('🔍 디지털데일리 스크래핑 중...');
    const ddailyArticles = await scrapeDigitalDaily();
    allArticles.push(...ddailyArticles);

    // 2. 한국경제신문 RSS
    console.log('🔍 한국경제신문 수집 중...');
    const hankyungArticles = await fetchHankyungRSS();
    allArticles.push(...hankyungArticles);

    // 3. 조선비즈 RSS
    console.log('🔍 조선비즈 수집 중...');
    const chosunArticles = await fetchChosunBiz();
    allArticles.push(...chosunArticles);

    // 4. 매일경제 RSS 추가
    console.log('🔍 매일경제 수집 중...');
    const maekyungArticles = await fetchMaekyung();
    allArticles.push(...maekyungArticles);

    // 5. 연합뉴스 IT RSS 추가
    console.log('🔍 연합뉴스IT 수집 중...');
    const yonhapArticles = await fetchYonhapIT();
    allArticles.push(...yonhapArticles);

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

async function scrapeDigitalDaily() {
  try {
    const response = await fetch('https://www.ddaily.co.kr/industry');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const articles = [];
    
    // 더 많은 기사 수집 (30개)
    $('.news_list li, .article_list li, .list_news li').each((index, element) => {
      if (index >= 30) return;
      
      const titleElement = $(element).find('a');
      const title = titleElement.text().trim();
      const link = titleElement.attr('href');
      
      if (title && link) {
        const fullLink = link.startsWith('http') ? link : `https://www.ddaily.co.kr${link}`;
        
        articles.push({
          id: `디지털데일리-${Date.now()}-${index}`,
          title: title,
          link: fullLink,
          source: '디지털데일리',
          category: '산업/기술',
          publishedAt: new Date().toISOString(),
          summary: generateQuickKeywords(title)
        });
      }
    });

    console.log(`📰 디지털데일리: ${articles.length}개 기사 수집`);
    return articles;
    
  } catch (error) {
    console.error('디지털데일리 스크래핑 실패:', error);
    return [];
  }
}

async function fetchHankyungRSS() {
  try {
    const feed = await parser.parseURL('https://www.hankyung.com/feed/all-news');
    const articles = [];
    
    // 20개로 증가
    for (let i = 0; i < Math.min(feed.items.length, 20); i++) {
      const item = feed.items[i];
      
      articles.push({
        id: `한국경제신문-${item.guid || Date.now()}-${i}`,
        title: item.title,
        link: item.link,
        source: '한국경제신문',
        category: '경제',
        publishedAt: item.pubDate,
        summary: generateQuickKeywords(item.title)
      });
    }
    
    console.log(`📰 한국경제신문: ${articles.length}개 기사 수집`);
    return articles;
    
  } catch (error) {
    console.error('한국경제신문 수집 실패:', error);
    return [];
  }
}

async function fetchChosunBiz() {
  try {
    const feed = await parser.parseURL('https://biz.chosun.com/rss/economy.xml');
    const articles = [];
    
    // 20개로 증가
    for (let i = 0; i < Math.min(feed.items.length, 20); i++) {
      const item = feed.items[i];
      
      articles.push({
        id: `조선비즈-${item.guid || Date.now()}-${i}`,
        title: item.title,
        link: item.link,
        source: '조선비즈',
        category: '경제',
        publishedAt: item.pubDate,
        summary: generateQuickKeywords(item.title)
      });
    }
    
    console.log(`📰 조선비즈: ${articles.length}개 기사 수집`);
    return articles;
    
  } catch (error) {
    console.error('조선비즈 수집 실패:', error);
    return [];
  }
}

async function fetchMaekyung() {
  try {
    const feed = await parser.parseURL('https://rss.mk.co.kr/rss/40300001.xml');
    const articles = [];
    
    for (let i = 0; i < Math.min(feed.items.length, 15); i++) {
      const item = feed.items[i];
      
      articles.push({
        id: `매일경제-${item.guid || Date.now()}-${i}`,
        title: item.title,
        link: item.link,
        source: '매일경제',
        category: '경제',
        publishedAt: item.pubDate,
        summary: generateQuickKeywords(item.title)
      });
    }
    
    console.log(`📰 매일경제: ${articles.length}개 기사 수집`);
    return articles;
    
  } catch (error) {
    console.error('매일경제 수집 실패:', error);
    return [];
  }
}

async function fetchYonhapIT() {
  try {
    const feed = await parser.parseURL('https://www.yna.co.kr/rss/it.xml');
    const articles = [];
    
    for (let i = 0; i < Math.min(feed.items.length, 15); i++) {
      const item = feed.items[i];
      
      articles.push({
        id: `연합뉴스IT-${item.guid || Date.now()}-${i}`,
        title: item.title,
        link: item.link,
        source: '연합뉴스IT',
        category: 'IT/기술',
        publishedAt: item.pubDate,
        summary: generateQuickKeywords(item.title)
      });
    }
    
    console.log(`📰 연합뉴스IT: ${articles.length}개 기사 수집`);
    return articles;
    
  } catch (error) {
    console.error('연합뉴스IT 수집 실패:', error);
    return [];
  }
}

function generateQuickKeywords(title) {
  // 제목 기반 빠른 키워드 생성
  if (title.includes('실적') || title.includes('매출') || title.includes('영업이익')) return '#실적개선 #매출증가 #수익성';
  if (title.includes('AI') || title.includes('인공지능') || title.includes('ChatGPT')) return '#AI기술 #디지털혁신 #기술발전';
  if (title.includes('투자') || title.includes('펀드') || title.includes('조달')) return '#투자유치 #자금조달 #성장동력';
  if (title.includes('부동산') || title.includes('아파트')) return '#부동산시장 #주택정책 #건설업';
  if (title.includes('반도체') || title.includes('메모리')) return '#반도체산업 #기술경쟁 #수출';
  if (title.includes('금리') || title.includes('인플레이션')) return '#금리정책 #통화정책 #경제동향';
  if (title.includes('주가') || title.includes('증시') || title.includes('코스피')) return '#주식시장 #투자심리 #시장동향';
  if (title.includes('스타트업') || title.includes('창업')) return '#스타트업 #창업생태계 #혁신기업';
  if (title.includes('IPO') || title.includes('상장')) return '#IPO #기업공개 #주식상장';
  if (title.includes('M&A') || title.includes('인수합병')) return '#M&A #인수합병 #기업재편';
  if (title.includes('카카오') || title.includes('네이버') || title.includes('삼성')) return '#대기업 #플랫폼 #기업동향';
  if (title.includes('전기차') || title.includes('배터리')) return '#전기차 #배터리산업 #친환경';
  if (title.includes('게임') || title.includes('메타버스')) return '#게임산업 #엔터테인먼트 #디지털콘텐츠';
  if (title.includes('바이오') || title.includes('제약')) return '#바이오산업 #제약업계 #헬스케어';
  if (title.includes('수출') || title.includes('무역')) return '#수출 #무역 #국제경제';
  
  return '#경제뉴스 #산업동향 #비즈니스';
}

// 실행
fetchMultipleNews();
