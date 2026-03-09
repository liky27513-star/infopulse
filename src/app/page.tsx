'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { config, Category } from '@/lib/config'

interface NewsItem {
  id: string
  title: string
  summary: string
  category: Category
  importance: number
  source: string
  sourceUrl: string
  isBreaking: boolean
  publishedAt: string
}

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all')

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news')
      const data = await response.json()
      setNews(data.news || [])
    } catch (error) {
      console.error('Failed to fetch news:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredNews = selectedCategory === 'all' ? news : news.filter((item) => item.category === selectedCategory)

  const categories: (Category | 'all')[] = ['all', 'ai', 'tech', 'politics', 'economy', 'crypto', 'prediction']

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-sky-900 mb-4">📡 InfoPulse</h1>
          <p className="text-xl text-gray-600">智能新闻聚合系统</p>
          <p className="text-sm text-gray-500 mt-2">实时追踪 AI、科技、政治、经济、加密货币、预测市场</p>
        </header>

        {/* Navigation */}
        <nav className="flex justify-center gap-4 mb-8">
          <Link href="/subscribe" className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition">
            订阅
          </Link>
          <Link href="/archive" className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
            历史记录
          </Link>
        </nav>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full transition ${
                selectedCategory === cat ? 'bg-sky-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {cat === 'all' ? '全部' : config.categories[cat]}
            </button>
          ))}
        </div>

        {/* News List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">暂无新闻数据</p>
            <p className="text-sm text-gray-500 mt-2">请等待系统采集数据或手动触发推送</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredNews.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function NewsCard({ item }: { item: NewsItem }) {
  const importanceEmoji = item.importance >= 9 ? '🔴' : item.importance >= 7 ? '🟡' : '⚪'

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-semibold text-sky-600 uppercase">{config.categories[item.category]}</span>
        <span className="text-lg">{importanceEmoji}</span>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-2">
        {item.isBreaking && <span className="text-red-600 mr-1">⚡</span>}
        {item.title}
      </h3>

      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{item.summary}</p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{item.source}</span>
        <span>{new Date(item.publishedAt).toLocaleDateString('zh-CN')}</span>
      </div>

      <a
        href={item.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block text-center text-sm text-sky-600 hover:text-sky-700"
      >
        查看原文 →
      </a>
    </div>
  )
}
