import * as React from 'react'
import { Html, Head, Body, Container, Heading, Text, Link, Section, Button } from '@react-email/components'
import { Category, SourceType, config } from '../../config'

interface BreakingNewsEmailProps {
  article: {
    title: string
    summary: string
    detailUrl: string
    sourceUrl: string
    source: string
    category: Category
    sourceType: SourceType
    importance: number
    publishedAt: Date
  }
  siteUrl: string
}

export function BreakingNewsEmail({ article, siteUrl }: BreakingNewsEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Heading style={headerStyle}>⚡ 突发情报提醒</Heading>

          <Section style={alertBoxStyle}>
            <Text style={categoryStyle}>
              [{config.categories[article.category]} · {config.sourceTypes[article.sourceType]}]
            </Text>
            <Heading as="h2" style={titleStyle}>
              {article.title}
            </Heading>
            <Text style={importanceStyle}>重要性评分: {article.importance}/10</Text>
          </Section>

          <Section style={contentStyle}>
            <Text style={summaryStyle}>{article.summary}</Text>
          </Section>

          <Section style={buttonSectionStyle}>
            <Button style={buttonStyle} href={article.detailUrl}>
              查看详细介绍
            </Button>
            <Button style={secondaryButtonStyle} href={article.sourceUrl}>
              查看原始来源
            </Button>
          </Section>

          <Section style={infoStyle}>
            <Text style={infoTextStyle}>来源: {article.source}</Text>
            <Text style={infoTextStyle}>时间: {new Intl.DateTimeFormat('zh-CN', { timeZone: config.timeZone, hourCycle: 'h23', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(article.publishedAt)}</Text>
          </Section>

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              这是 InfoPulse 自动检测到的重点事件。历史归档与订阅管理请访问{' '}
              <Link href={siteUrl} style={linkStyle}>
                {siteUrl}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const mainStyle: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const containerStyle: React.CSSProperties = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '620px',
}

const headerStyle: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 'bold',
  textAlign: 'center',
  margin: '0 0 20px',
  color: '#dc2626',
}

const alertBoxStyle: React.CSSProperties = {
  backgroundColor: '#fee2e2',
  padding: '20px',
  borderRadius: '8px',
  border: '2px solid #dc2626',
  marginBottom: '20px',
}

const categoryStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#dc2626',
  margin: '0 0 10px',
}

const titleStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1e293b',
  margin: '0 0 10px',
}

const importanceStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#dc2626',
  fontWeight: 'bold',
  margin: '0',
}

const contentStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '20px',
}

const summaryStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#334155',
  lineHeight: '1.8',
  margin: '0',
}

const buttonSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '20px',
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#dc2626',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 'bold',
  fontSize: '15px',
  marginRight: '10px',
}

const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#e2e8f0',
  color: '#0f172a',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 'bold',
  fontSize: '15px',
}

const infoStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '20px',
}

const infoTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#64748b',
  margin: '5px 0',
}

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  borderTop: '1px solid #e2e8f0',
  paddingTop: '20px',
}

const footerTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0',
}

const linkStyle: React.CSSProperties = {
  color: '#0284c7',
  textDecoration: 'none',
}
