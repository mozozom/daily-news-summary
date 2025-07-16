import fetch from 'node-fetch';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import fs from 'fs';

const parser = new Parser();
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

async function fetchDigitalDailyNews() {
  try {
    // 디지털데일리 RSS 피드
    const rssUrl = 'https://www.ddaily.co.kr/rss/S1N15.xml';
    const feed = await parser.parseURL(rssUrl);
    
    console.log(`📰 ${feed.items.length}개 기사 발견`);
    
    // 최신 10개 기사만 처리
    const recentArticles = feed.items.slice(0, 10);
    
    const processedArticles = [];
    
    for (const item of recentArticles) {
      console.log(`처리 중: ${item.title}`);
      
      // 기사 본문 추출
      const content = await extractArticleContent(item.link);
      
      // Claude API로 요약
      const summary = await summarizeWithClaude(item.title, content);
      
      processedArticles.push({
        id: item.guid || item.link,
        title: item.title,
        link: item.link,
        content: content.substring(0, 300) + '...',
        summary: summary,
        publishedAt: item.pubDate,
        category: extractCategory(item.categories)
      });
      
      // API 호출 간격 조절
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // JSON 파일로 저장
    const newsData = {
      lastUpdated: new Date().toISOString(),
      articles: processedArticles
    };
    
    fs.writeFileSync('docs/news-data.json', JSON.stringify(newsData, null, 2));
    console.log('✅ 뉴스 데이터 저장 완료');
    
  } catch (error) {
    console.error('❌ 뉴스 수집 실패:', error);
    process.exit(1);
  }
}

async function extractArticleContent(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 디지털데일리 기사 본문 추출 (실제 사이트 구조에 맞게 조정 필요)
    const content = $('.article-content, .news-content, #articleText').text().trim();
    
    return content || '본문을 추출할 수 없습니다.';
  } catch (error) {
    console.error('본문 추출 실패:', error);
    return '본문을 추출할 수 없습니다.';
  }
}

async function summarizeWithClaude(title, content) {
  try {
    const prompt = `다음 뉴스 기사를 경영진이 읽기 좋도록 체계적으로 요약해주세요:

제목: ${title}
내용: ${content.substring(0, 2000)}

요약 형식:
📌 핵심 내용: (한 줄로 핵심만)
💡 주요 포인트:
- 첫 번째 포인트
- 두 번째 포인트  
- 세 번째 포인트 (있다면)
🎯 비즈니스 영향: (이 뉴스가 비즈니스/경영에 미칠 영향)

각 섹션은 간결하되 구체적으로 작성해주세요. 전체 200자 내외로 정리해주세요.`;

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
    return `📌 핵심 내용: 요약을 생성할 수 없습니다.
💡 주요 포인트:
- 원문을 직접 확인해주세요
🎯 비즈니스 영향: 분석 불가`;
  }
}

function extractCategory(categories) {
  if (!categories || categories.length === 0) return '일반';
  return categories[0] || '일반';
}

// 실행
fetchDigitalDailyNews(); // 강제 업데이트
