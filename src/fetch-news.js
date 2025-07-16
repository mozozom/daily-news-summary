import fetch from 'node-fetch';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import fs from 'fs';

const parser = new Parser();
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

async function fetchMultipleNews() {
  try {
    console.log('📰 여러 뉴스 소스에서 기사 수집 시작...');
    
    const allArticles = [];
    
    // 1. 디지털데일리 뉴스 수집
    console.log('🔍 디지털데일리 수집 중...');
    const ddailyArticles = await fetchFromSource(
      'https://www.ddaily.co.kr/rss/S1N15.xml',
      '디지털데일리',
      5
    );
    allArticles.push(...ddailyArticles);

    // 2. 한국경제신문 뉴스 수집
    console.log('🔍 한국경제신문 수집 중...');
    const hankyungArticles = await fetchFromSource(
      'https://www.hankyung.com/feed/all-news',
      '한국경제신문',
      5
    );
    allArticles.push(...hankyungArticles);

    // 발행시간 순으로 정렬 (최신순)
    allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    console.log(`📊 총 ${allArticles.length}개 기사 수집 완료`);

    // JSON 파일로 저장
    const newsData = {
      lastUpdated: new Date().toISOString(),
      articles: allArticles
    };
    
    fs.writeFileSync('docs/news-data.json', JSON.stringify(newsData, null, 2));
    console.log('✅ 뉴스 데이터 저장 완료');
    
  } catch (error) {
    console.error('❌ 뉴스 수집 실패:', error);
    process.exit(1);
  }
}

async function fetchFromSource(rssUrl, sourceName, maxCount) {
  try {
    const feed = await parser.parseURL(rssUrl);
    
    if (!feed || !feed.items || feed.items.length === 0) {
      console.log(`⚠️ ${sourceName} RSS 피드가 비어있습니다`);
      return [];
    }

    console.log(`📰 ${sourceName}에서 ${feed.items.length}개 기사 발견`);
    
    // 지정된 개수만큼만 처리
    const recentArticles = feed.items.slice(0, maxCount);
    const processedArticles = [];
    
    for (const item of recentArticles) {
      console.log(`처리 중: [${sourceName}] ${item.title}`);
      
      // 기사 본문 추출
      const content = await extractArticleContent(item.link, sourceName);
      
      // Claude API로 요약
      const summary = await summarizeWithClaude(item.title, content);
      
      processedArticles.push({
        id: `${sourceName}-${item.guid || item.link}`,
        title: item.title,
        link: item.link,
        content: content.substring(0, 300) + '...',
        summary: summary,
        publishedAt: item.pubDate,
        category: extractCategory(item.categories),
        source: sourceName
      });
      
      // API 호출 간격 조절 (3초)
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    return processedArticles;
    
  } catch (error) {
    console.error(`❌ ${sourceName} 수집 실패:`, error);
    return [];
  }
}

async function extractArticleContent(url, sourceName) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    let content = '';
    
    if (sourceName === '디지털데일리') {
      content = $('.article-content, .news-content, #articleText, .view_text').text().trim();
    } else if (sourceName === '한국경제신문') {
      content = $('.article-content, .news-content, #articleText, .article_txt').text().trim();
    } else {
      content = $('.article-content, .news-content, #articleText').text().trim();
    }
    
    return content || '본문을 추출할 수 없습니다.';
  } catch (error) {
    console.error(`본문 추출 실패 [${sourceName}]:`, error);
    return '본문을 추출할 수 없습니다.';
  }
}

async function summarizeWithClaude(title, content) {
  try {
    const prompt = `다음 뉴스를 5줄로 요약해주세요:

제목: ${title}
내용: ${content.substring(0, 1500)}

요구사항:
- 정확히 5줄로 요약
- 각 줄은 한 문장으로 구성
- 경영진이 알아야 할 핵심 정보만 포함
- 불필요한 서술어나 감정 표현 제거
- 구체적인 수치나 날짜가 있으면 포함

예시 형식:
엔씨소프트가 2분기 실적 개선을 위한 비용 효율화 전략을 추진하고 있다.
하반기 신작 게임 출시를 통해 매출 증대를 기대하고 있다.
SK증권은 목표주가를 상향 조정했다.
게임업계 전반적인 회복세가 예상된다.
투자자들의 관심이 높아지고 있는 상황이다.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLAUDE_API_KEY}`,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    const result = await response.json();
    return result.content[0].text.trim();
    
  } catch (error) {
    console.error('AI 요약 실패:', error);
    return '요약을 생성할 수 없습니다.';
  }
}

function extractCategory(categories) {
  if (!categories || categories.length === 0) return '일반';
  return categories[0] || '일반';
}

// 실행
fetchMultipleNews();
