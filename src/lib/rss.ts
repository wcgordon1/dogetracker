import { XMLParser } from 'fast-xml-parser';

export interface Article {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
}

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const RSS_URL = 'https://news.google.com/rss/search?q=doge';

function parseXMLDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

function cleanHTML(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

export async function fetchRSSFeed(): Promise<Article[]> {
  try {
    const response = await fetch(CORS_PROXY + encodeURIComponent(RSS_URL));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    
    const result = parser.parse(xmlText);
    const items = result.rss.channel.item;

    return items
      .map((item: any) => ({
        title: cleanHTML(item.title || ''),
        link: item.link || '',
        pubDate: parseXMLDate(item.pubDate),
        source: typeof item.source === 'object' ? item.source['#text'] : (item.source || 'Google News'),
        description: cleanHTML(item.description || '')
      }))
      .filter((article: Article) => {
        const articleDate = new Date(article.pubDate);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return articleDate >= weekAgo;
      })
      .slice(0, 50);
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    return [];
  }
}