import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('요약 요청:', url);

    // 1단계: 원문 내용 추출
    const articleContent = await fetchArticleContent(url);
    
    if (!articleContent || articleContent.length < 100) {
      return res.status(400).json({ error: '기사 내용을 추출할 수 없습니다.' });
    }

    console.log('원문 길이:', articleContent.length);

    // 2단계: Claude API로 요약
    const summary = await summarizeWithClaude(articleContent);
    
    const compressionRate = Math.round((summary.length / articleContent.length) * 100);

    return res.status(200).json({
      summary: summary,
      originalLength: articleContent.length,
      summaryLength: summary.length,
      compressionRate: compressionRate
    });

  } catch (error) {
    console.error('요약 실패:', error);
    return res.status(500).json({ 
      error: '요약 생성 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

async function fetchArticleContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

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
      'article',
      '.post-content',
      '.article-body',
      '.entry-content',
      '.news-content-area'
    ];

    let content = '';
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length) {
        content = element.text().trim();
        if (content && content.length > 200) {
          break;
        }
      }
    }

    // 기본 본문이 없으면 p 태그들에서 추출
    if (!content || content.length < 200) {
      const paragraphs = $('p');
      content = paragraphs.map((i, el) => $(el).text()).get()
        .filter(text => text && text.length > 30)
        .join(' ');
    }

    // 불필요한 텍스트 제거
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();

    return content.substring(0, 4000); // 최대 4000자

  } catch (error) {
    console.error('원문 추출 실패:', error);
    throw new Error('원문을 가져올 수 없습니다.');
  }
}

async function summarizeWithClaude(content) {
  try {
    const prompt = `다음 뉴스 기사를 경영진이 읽기 쉽도록 요약해주세요:

${content}

요약 조건:
- 원문의 15-20% 길이로 요약
- 핵심 내용과 중요한 수치는 반드시 포함
- 3-4개 문단으로 구성
- 경영 관점에서 중요한 정보 우선
- 명확하고 간결한 문체 사용

요약:`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLAUDE_API_KEY}`,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API 오류: ${response.status}`);
    }

    const result = await response.json();
    return result.content[0].text.trim();

  } catch (error) {
    console.error('Claude API 실패:', error);
    
    // Claude API 실패 시 간단한 추출 요약
    return extractKeyParagraphs(content);
  }
}

function extractKeyParagraphs(content) {
  const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 20);
  
  // 중요도 점수 기반 문장 선별
  const importantWords = [
    '발표', '계획', '예정', '추진', '증가', '감소', '상승', '하락', 
    '투자', '개발', '출시', '확대', '성장', '전망', '목표', '달성', 
    '실적', '매출', '순이익', '영업이익', '매출액'
  ];
  
  const scoredSentences = sentences.map(sentence => {
    let score = 0;
    
    // 길이 점수
    const words = sentence.split(' ');
    if (words.length >= 5 && words.length <= 30) score += 1;
    
    // 키워드 점수
    importantWords.forEach(word => {
      if (sentence.includes(word)) score += 2;
    });
    
    // 숫자 포함 점수
    if (/\d/.test(sentence)) score += 1;
    
    return { sentence: sentence.trim(), score };
  });
  
  const topSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.sentence);
  
  return topSentences.join('. ') + '.';
}
