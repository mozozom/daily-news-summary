import fetch from 'node-fetch';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import fs from 'fs';

const parser = new Parser();
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

async function fetchDigitalDailyNews() {
  try {
    // 한국경제신문 RSS 피드
    const rssUrl = 'https://www.hankyung.com/feed/all-news';
    let feed;
    try {
      feed = await parser.parseURL(rssUrl);
      if (!feed || !feed.items || feed.items.length === 0) {
        throw new Error('RSS 피드가 비어있습니다');
      }
    } catch (error) {
      console.log('한경 RSS 실패, 대체 RSS 사용:', error.message);
      feed = await parser.parseURL('https://feeds.feedburner.com/hankyung/news');
    }

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
      
      // API 호출 간격 조절 (3초로 증가)
      await new Promise(resolve => setTimeout(resolve, 3000));
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
    
    // 한국경제신문 기사 본문 추출
    const content = $('.article-content, .news-content, #articleText, .article_txt').text().trim();
    
    return content || '본문을 추출할 수 없습니다.';
  } catch (error) {
    console.error('본문 추출 실패:', error);
    return '본문을 추출할 수 없습니다.';
  }
}

async function summarizeWithClaude(title, content) {
  try {
    const prompt = `다음 뉴스를 간단히 요약해주세요:

제목: ${title}
내용: ${content.substring(0, 1000)}

다음 형식으로 답해주세요:
📌 핵심 내용: (한 줄 요약)
💡 주요 포인트:
- 포인트 1
- 포인트 2
🎯 비즈니스 영향: (경영에 미치는 영향)

간단명료하게 작성해주세요.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLAUDE_API_KEY}`,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    const result = await response.json();
    return result.content[0].text.trim();
    
  } catch (error) {
    console.error('AI 요약 실패:', error);
    return `📌 핵심 내용: ${title}
💡 주요 포인트:
- 상세 내용은 원문을 확인해주세요
🎯 비즈니스 영향: 원문 참조`;
  }
}

function extractCategory(categories) {
  if (!categories || categories.length === 0) return '일반';
  return categories[0] || '일반';
}

// 실행
fetchDigitalDailyNews();
