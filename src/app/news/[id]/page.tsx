import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { config, Category, SourceType } from '@/lib/config'

interface PageProps {
  params: {
    id: string
  }
}

export default async function NewsDetailPage({ params }: PageProps) {
  const article = await prisma.newsItem.findUnique({
    where: { id: params.id },
  })

  if (!article) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 flex gap-4 text-sm">
          <Link href="/" className="text-sky-600 hover:text-sky-700">
            ← 返回首页
          </Link>
          <Link href="/archive" className="text-sky-600 hover:text-sky-700">
            查看历史记录
          </Link>
        </div>

        <article className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-sm font-medium">
              {config.categories[article.category as Category]}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
              {config.sourceTypes[article.sourceType as SourceType]}
            </span>
            {article.isBreaking && (
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">重点事件</span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-4">{article.title}</h1>

          <div className="text-sm text-slate-500 space-y-1 mb-8">
            <p>来源：{article.source}</p>
            <p>发布时间：{new Date(article.publishedAt).toLocaleString('zh-CN')}</p>
            <p>重要性：{article.importance}/10</p>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">一句话摘要</h2>
            <p className="text-slate-700 leading-8">{article.summary}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">详细介绍</h2>
            <div className="whitespace-pre-wrap text-slate-700 leading-8">
              {article.detail || article.summary}
            </div>
          </section>

          <div className="flex flex-wrap gap-4">
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-5 py-3 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition"
            >
              查看原始来源
            </a>
            <Link
              href="/"
              className="inline-flex items-center px-5 py-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              返回首页
            </Link>
          </div>
        </article>
      </div>
    </main>
  )
}
