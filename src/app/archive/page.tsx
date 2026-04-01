'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DigestNewsItem {
  id: string
  title: string
  source: string
}

interface Digest {
  id: string
  sentAt: string
  type: string
  overview?: string | null
  recipientCount: number
  newsItems: DigestNewsItem[]
}

export default function ArchivePage() {
  const [digests, setDigests] = useState<Digest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchDigests()
  }, [])

  const fetchDigests = async () => {
    try {
      const response = await fetch('/api/digests')
      const data = await response.json()
      setDigests(data.digests || [])
    } catch (error) {
      console.error('Failed to fetch digests:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-sky-900 mb-4">历史推送记录</h1>
          <p className="text-gray-600">查看过往的情报简报与重点事件</p>
        </header>

        <Link href="/" className="inline-block mb-8 text-sky-600 hover:text-sky-700">
          ← 返回首页
        </Link>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : digests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">暂无推送记录</p>
          </div>
        ) : (
          <div className="space-y-6">
            {digests.map((digest) => (
              <div key={digest.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        digest.type === 'breaking' ? 'bg-red-100 text-red-800' : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {digest.type === 'breaking' ? '突发情报' : '定时简报'}
                    </span>
                    <span className="ml-3 text-gray-600">{new Date(digest.sentAt).toLocaleString('zh-CN')}</span>
                  </div>
                  <span className="text-sm text-gray-500">发送给 {digest.recipientCount} 人</span>
                </div>

                {digest.overview && <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-4 mb-4">{digest.overview}</p>}

                <div className="space-y-2">
                  {digest.newsItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="text-sm flex items-center justify-between gap-4">
                      <div>
                        <Link href={`/news/${item.id}`} className="font-medium hover:text-sky-700">
                          {item.title}
                        </Link>
                        <span className="text-gray-500 ml-2">- {item.source}</span>
                      </div>
                      <Link href={`/news/${item.id}`} className="text-sky-600 hover:text-sky-700 whitespace-nowrap">
                        详情 →
                      </Link>
                    </div>
                  ))}
                  {digest.newsItems.length > 5 && (
                    <p className="text-sm text-gray-500">还有 {digest.newsItems.length - 5} 条新闻...</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
