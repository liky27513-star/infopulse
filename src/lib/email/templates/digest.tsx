import * as React from 'react'
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Link,
  Section,
  Hr,
  Button,
} from '@react-email/components'
import { Category, SourceType, config } from '../../config'

export interface DigestEmailArticle {
  id: string
  title: string
  summary: string
  detailUrl: string
  sourceUrl: string
  source: string
  category: Category
  sourceType: SourceType
  importance: number
  isBreaking: boolean
  publishedAt: Date
}

interface DigestEmailProps {
  overview: string
  articles: DigestEmailArticle[]
  digestTime: string
  siteUrl: string
}

export function DigestEmail({ overview, articles, digestTime, siteUrl }: DigestEmailProps) {
  const sortedArticles = [...articles].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())

  return (
    <Html>
      <Head />
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Heading style={headerStyle}>📡 InfoPulse 今日情报</Heading>
          <Text style={timeStyle}>{digestTime}</Text>

          <Section style={overviewBoxStyle}>
            <Text style={overviewLabelStyle}>今日总览</Text>
            <Text style={overviewTextStyle}>{overview}</Text>
          </Section>

          <Section style={statsRowStyle}>
            <StatCard label="事件数" value={String(sortedArticles.length)} />
            <StatCard label="重点领域" value={Array.from(new Set(sortedArticles.slice(0, 4).map((article) => config.categories[article.category]))).join(' / ')} />
          </Section>

          <Hr style={hrStyle} />

          <Section>
            <Heading as="h2" style={sectionTitleStyle}>
              时间线摘要
            </Heading>

            {sortedArticles.map((article) => (
              <Section key={article.id} style={articleStyle}>
                <Text style={metaStyle}>
                  {formatPublishedAt(article.publishedAt)} · {getCategoryEmoji(article.category)} {config.categories[article.category]} · {config.sourceTypes[article.sourceType]}
                </Text>
                <Text style={articleTitleStyle}>
                  <Link href={article.detailUrl} style={titleLinkStyle}>
                    {article.isBreaking ? '⚡ ' : ''}
                    {article.title}
                  </Link>
                </Text>
                <Text style={articleSummaryStyle}>{article.summary}</Text>
                <Text style={sourceTextStyle}>来源：{article.source}</Text>
                <Section style={buttonRowStyle}>
                  <Button href={article.detailUrl} style={primaryButtonStyle}>
                    查看详情
                  </Button>
                  <Button href={article.sourceUrl} style={secondaryButtonStyle}>
                    原始来源
                  </Button>
                </Section>
              </Section>
            ))}
          </Section>

          <Hr style={hrStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              详情页与历史归档：{' '}
              <Link href={siteUrl} style={linkStyle}>
                {siteUrl}
              </Link>
            </Text>
            <Text style={footerTextStyle}>
              管理订阅：{' '}
              <Link href={`${siteUrl}/subscribe`} style={linkStyle}>
                {siteUrl}/subscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Section style={statCardStyle}>
      <Text style={statLabelStyle}>{label}</Text>
      <Text style={statValueStyle}>{value}</Text>
    </Section>
  )
}

const formatPublishedAt = (date: Date) =>
  new Intl.DateTimeFormat('zh-CN', {
    timeZone: config.timeZone,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)

const mainStyle: React.CSSProperties = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const containerStyle: React.CSSProperties = {
  margin: '0 auto',
  padding: '24px 0 48px',
  maxWidth: '680px',
}

const headerStyle: React.CSSProperties = {
  fontSize: '30px',
  fontWeight: 'bold',
  textAlign: 'center',
  margin: '0 0 10px',
  color: '#0c4a6e',
}

const timeStyle: React.CSSProperties = {
  fontSize: '14px',
  textAlign: 'center',
  color: '#64748b',
  margin: '0 0 20px',
}

const overviewBoxStyle: React.CSSProperties = {
  backgroundColor: '#e0f2fe',
  border: '1px solid #7dd3fc',
  borderRadius: '12px',
  padding: '18px',
  marginBottom: '18px',
}

const overviewLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#0369a1',
  fontWeight: 'bold',
  margin: '0 0 8px',
  textTransform: 'uppercase',
}

const overviewTextStyle: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '1.7',
  color: '#0f172a',
  margin: 0,
}

const statsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  marginBottom: '18px',
}

const statCardStyle: React.CSSProperties = {
  display: 'inline-block',
  width: '48%',
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  padding: '14px',
  border: '1px solid #e2e8f0',
}

const statLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0 0 8px',
}

const statValueStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#0f172a',
  margin: 0,
}

const hrStyle: React.CSSProperties = {
  borderColor: '#e2e8f0',
  margin: '20px 0',
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '22px',
  color: '#0369a1',
  margin: '0 0 16px',
}

const articleStyle: React.CSSProperties = {
  marginBottom: '16px',
  padding: '16px',
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
}

const metaStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0 0 8px',
}

const articleTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 10px',
}

const titleLinkStyle: React.CSSProperties = {
  color: '#0f172a',
  textDecoration: 'none',
}

const articleSummaryStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#334155',
  margin: '0 0 10px',
  lineHeight: '1.7',
}

const sourceTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0 0 12px',
}

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
}

const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#0284c7',
  color: '#ffffff',
  padding: '10px 18px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '13px',
}

const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#e2e8f0',
  color: '#0f172a',
  padding: '10px 18px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '13px',
}

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
}

const footerTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#64748b',
  margin: '5px 0',
}

const linkStyle: React.CSSProperties = {
  color: '#0284c7',
  textDecoration: 'none',
}

function getCategoryEmoji(category: Category): string {
  const emojis: Record<Category, string> = {
    ai: '🤖',
    tech: '💻',
    science: '🧪',
    water: '💧',
    politics: '🏛️',
    economy: '💰',
    crypto: '🪙',
    prediction: '🔮',
  }

  return emojis[category] || '📰'
}
