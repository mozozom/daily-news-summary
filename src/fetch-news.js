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

    // 3. 조선비즈 RSS 추가
    console.log('🔍 조선비즈 수집 중...');
    const chosunArticles = await fetchChosunBiz();
    allArticles.push(...chosunArticles);

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
    
    // 디지털데일리 기사 목록 추출
    $('.news_list li, .article_list li, .list_news li').each((index, element) => {
      if (index >= 20) return; // 최대 20개
      
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
          summary: '요약 생성 중...'
        });
      }
    });

    // AI로 관련 기사만 필터링
    const filteredArticles = await filterRelevantNews(articles);
    
    // 각 기사 요약 생성
    for (let i = 0; i < Math.min(filteredArticles.length, 10); i++) {
      const article = filteredArticles[i];
      console.log(`요약 생성 중: ${article.title}`);
      
      const content = await extractArticleContent(article.link);
      article.summary = await summarizeWithClaude(article.title, content);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return filteredArticles;
    
  } catch (error) {
    console.error('디지털데일리 스크래핑 실패:', error);
    return [];
  }
}

async function fetchHankyungRSS() {
  try {
    const feed = await parser.parseURL('https://www.hankyung.com/feed/all-news');
    const articles = [];
    
    for (let i = 0; i < Math.min(feed.items.length, 15); i++) {
      const item = feed.items[i];
      
      articles.push({
        id: `한국경제신문-${item.guid || Date.now()}-${i}`,
        title: item.title,
        link: item.link,
        source: '한국경제신문',
        category: '경제',
        publishedAt: item.pubDate,
        summary: '요약 생성 중...'
      });
    }
    
    // 일부만 요약 생성
    for (let i = 0; i < Math.min(articles.length, 8); i++) {
      const article = articles[i];
      const content = await extractArticleContent(article.link);
      article.summary = await summarizeWithClaude(article.title, content);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
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
    
    for (let i = 0; i < Math.min(feed.items.length, 15); i++) {
      const item = feed.items[i];
      
      articles.push({
        id: `조선비즈-${item.guid || Date.now()}-${i}`,
        title: item.title,
        link: item.link,
        source: '조선비즈',
        category: '경제',
        publishedAt: item.pubDate,
        summary: await summarizeWithClaude(item.title, item.contentSnippet || item.title)
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return articles;
    
  } catch (error) {
    console.error('조선비즈 수집 실패:', error);
    return [];
  }
}

async function filterRelevantNews(articles) {
  try {
    const titles = articles.map(a => a.title).join('\n');
    
    const prompt = `다음 뉴스 제목들 중에서 경영진이 알아야 할 중요한 기술/산업/경제 뉴스만 선별해주세요:

${titles}

선별 기준:
- 기업 경영에 영향을 미치는 뉴스
- 기술 트렌드 및 산업 동향
- 경제/금융 관련 뉴스
- 정책/규제 변화
- 제외: 연예, 스포츠, 사건사고

선별된 제목들을 원래 제목 그대로 한 줄씩 나열해주세요.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLAUDE_API_KEY}`,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    const result = await response.json();
    const selectedTitles = result.content[0].text.trim().split('\n').map(t => t.trim());
    
    return articles.filter(article => 
      selectedTitles.some(selectedTitle => 
        article.title.includes(selectedTitle) || selectedTitle.includes(article.title)
      )
    );
    
  } catch (error) {
    console.error('AI 필터링 실패:', error);
    return articles; // 필터링 실패시 원본 반환
  }
}

async function extractArticleContent(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const content = $('.article-content, .news-content, #articleText, .article_txt, .view_text').text().trim();
    return content.substring(0, 1000) || '본문 추출 실패';
    
  } catch (error) {
    return '본문 추출 실패';
  }
}

async function summarizeWithClaude(title, content) {
  try {
    const prompt = `다음 뉴스를 3줄로 요약해주세요:

제목: ${title}
내용: ${content}

경영진용 요약 (3줄):`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLAUDE_API_KEY}`,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    const result = await response.json();
    return result.content[0].text.trim();
    
  } catch (error) {
    return '요약 생성 실패';
  }
}

// 실행
fetchMultipleNews();
