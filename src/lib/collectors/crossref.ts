import axios from 'axios'
import { Category, JournalSource, SourceType, config } from '../config'

export interface JournalArticle {
  title: string
  description: string
  url: string
  source: string
  publishedAt: Date
  category: Category
  sourceType: SourceType
}

interface CrossrefAuthor {
  given?: string
  family?: string
  name?: string
}

interface CrossrefItem {
  DOI?: string
  URL?: string
  title?: string[]
  abstract?: string
  author?: CrossrefAuthor[]
  created?: {
    'date-parts'?: number[][]
  }
  issued?: {
    'date-parts'?: number[][]
  }
  'published-print'?: {
    'date-parts'?: number[][]
  }
  'published-online'?: {
    'date-parts'?: number[][]
  }
}

interface CrossrefResponse {
  message?: {
    items?: CrossrefItem[]
  }
}

function buildDate(parts?: number[][]): Date | null {
  const values = parts?.[0]
  if (!values?.length) return null

  const [year, month = 1, day = 1] = values
  return new Date(Date.UTC(year, Math.max(month - 1, 0), day))
}

function formatAuthor(author: CrossrefAuthor) {
  if (author.name) return author.name
  return [author.given, author.family].filter(Boolean).join(' ')
}

function cleanAbstract(raw?: string) {
  if (!raw) return ''

  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;|&gt;|&amp;|&#x0D;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export class CrossrefCollector {
  private baseUrl: string
  private timeout: number
  private rowsPerJournal: number

  constructor() {
    this.baseUrl = config.collectors.crossref.baseUrl
    this.timeout = config.collectors.crossref.timeout
    this.rowsPerJournal = config.collectors.crossref.rowsPerJournal
  }

  private formatSince(since?: Date) {
    if (!since) {
      return null
    }

    return since.toISOString().slice(0, 10)
  }

  private getPublishedAt(item: CrossrefItem) {
    return (
      buildDate(item['published-online']?.['date-parts']) ||
      buildDate(item['published-print']?.['date-parts']) ||
      buildDate(item.issued?.['date-parts']) ||
      buildDate(item.created?.['date-parts']) ||
      new Date()
    )
  }

  private buildDescription(item: CrossrefItem, source: JournalSource) {
    const abstract = cleanAbstract(item.abstract)
    if (abstract) {
      return abstract
    }

    const authors = (item.author || []).map(formatAuthor).filter(Boolean).slice(0, 6)
    const authorsText = authors.length > 0 ? `作者：${authors.join('、')}` : ''
    return [authorsText, `期刊：${source.name}`].filter(Boolean).join(' ｜ ')
  }

  async fetchJournal(source: JournalSource, since?: Date): Promise<JournalArticle[]> {
    try {
      const filters = [`issn:${source.issn}`]
      const sinceDate = this.formatSince(since)
      if (sinceDate) {
        filters.push(`from-pub-date:${sinceDate}`)
      }

      const response = await axios.get<CrossrefResponse>(this.baseUrl, {
        params: {
          filter: filters.join(','),
          sort: 'published',
          order: 'desc',
          rows: this.rowsPerJournal,
          mailto: process.env.CROSSREF_MAILTO || process.env.SMTP_USER || undefined,
        },
        timeout: this.timeout,
        headers: {
          'User-Agent': 'InfoPulse/1.0 (https://infopulse.local)',
        },
      })

      const results: JournalArticle[] = []

      for (const item of response.data.message?.items || []) {
        const title = item.title?.[0]?.trim() || ''
        const url = item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : '')
        if (!title || !url) {
          continue
        }

        results.push({
          title,
          description: this.buildDescription(item, source),
          url,
          source: source.name,
          publishedAt: this.getPublishedAt(item),
          category: source.category,
          sourceType: source.sourceType,
        })
      }

      return results
    } catch (error) {
      console.error(`Crossref journal fetch error for ${source.name}:`, error)
      return []
    }
  }

  async fetchConfiguredJournals(since?: Date): Promise<JournalArticle[]> {
    const results = await Promise.all(config.journals.map((journal) => this.fetchJournal(journal, since)))
    return results.flat()
  }
}
