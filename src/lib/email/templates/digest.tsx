import * as React from 'react'
import { Html, Head, Body, Container, Heading, Text, Link, Section, Hr } from '@react-email/components'
import { ProcessedArticle } from '../../ai/groq-processor'
import { config, Category } from '../../config'

interface DigestEmailProps {
  articles: ProcessedArticle[]
  digestTime: string
  siteUrl: string
}

export function DigestEmail({ articles, digestTime, siteUrl }: DigestEmailProps) {
  // 按类别分组
  const groupedArticles = articles.reduce((acc, article) => {
    if (!acc[article.category]) {
      acc[article.category] = []
    }
    acc[article.category].push(article)
    return acc
  }, {} as Record<Category, ProcessedArticle[]>)

  return (
    <Html>
      <Head />
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Heading style={headerStyle}>📡 InfoPulse 智能简报</Heading>
          <Text style={timeStyle}>{digestTime}</Text>
          <Hr style={hrStyle} />

          {Object.entries(groupedArticles).map(([category, categoryArticles]) => (
            <Section key={category} style={sectionStyle}>
              <Heading as="h2" style={categoryHeaderStyle}>
                {getCategoryEmoji(category as Category)} {config.categories[category as Category]}
              </Heading>
              {categoryArticles.map((article, index) => (
                <ArticleItem key={index} article={article} />
              ))}
            </Section>
          ))}

          <Hr style={hrStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              📊 完整报告:{' '}
              <Link href={siteUrl} style={linkStyle}>
                {siteUrl}
              </Link>
            </Text>
            <Text style={footerTextStyle}>
              ⚙️ 管理订阅:{' '}
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

function ArticleItem({ article }: { article: ProcessedArticle }) {
  const importanceEmoji = article.importance >= 9 ? '🔴' : article.importance >= 7 ? '🟡' : '⚪'

  return (
    <Section style={articleStyle}>
      <Text style={articleTitleStyle}>
        {importanceEmoji} {article.isBreaking && '⚡ '} {article.title}
      </Text>
      <Text style={articleSummaryStyle}>{article.summary}</Text>
      <Link href={article.sourceUrl} style={sourceLinkStyle}>
        来源: {article.source} →
      </Link>
    </Section>
  )
}

// 样式定义
const mainStyle: React.CSSProperties = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const containerStyle: React.CSSProperties = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
}

const headerStyle: React.CSSProperties = {
  fontSize: '28px',
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

const hrStyle: React.CSSProperties = {
  borderColor: '#e2e8f0',
  margin: '20px 0',
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '30px',
}

const categoryHeaderStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '15px',
  color: '#0369a1',
  borderBottom: '2px solid #0369a1',
  paddingBottom: '5px',
}

const articleStyle: React.CSSProperties = {
  marginBottom: '20px',
  padding: '15px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
}

const articleTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 10px',
  color: '#1e293b',
}

const articleSummaryStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#475569',
  margin: '0 0 10px',
  lineHeight: '1.6',
}

const sourceLinkStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#0284c7',
  textDecoration: 'none',
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
    politics: '🏛️',
    economy: '💰',
    crypto: '🪙',
    prediction: '🔮',
  }
  return emojis[category] || '📰'
}
