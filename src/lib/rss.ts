import { XMLParser } from 'fast-xml-parser';

export interface Article {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
}

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const RSS_URL = 'https://news.google.com/rss/search?q=doge&hl=en-US&gl=US&ceid=US:en';

function parseXMLDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

function extractTextContent(element: Element, tagName: string): string {
  const node = element.querySelector(tagName);
  return node?.textContent ?? '';
}

function isWithinLastWeek(dateStr: string): boolean {
  const articleDate = new Date(dateStr);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return articleDate >= weekAgo;
}

export async function fetchRSSFeed() {
  try {
    const response = await fetch(CORS_PROXY + encodeURIComponent(RSS_URL));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const items = Array.from(xmlDoc.querySelectorAll('item'));
    
    return items
      .map(item => ({
        title: extractTextContent(item, 'title'),
        link: extractTextContent(item, 'link'),
        pubDate: extractTextContent(item, 'pubDate'),
        source: extractTextContent(item, 'source') || 'Google News',
        description: extractTextContent(item, 'description'),
      }))
      .filter(article => isWithinLastWeek(article.pubDate))
      .map(article => ({
        ...article,
        pubDate: parseXMLDate(article.pubDate),
      }));
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    throw error;
  }
}