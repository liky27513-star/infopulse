import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 获取最新新闻
export async function GET() {
  try {
    const news = await prisma.newsItem.findMany({
      take: 50,
      orderBy: { publishedAt: 'desc' },
      include: {
        digest: true,
      },
    })

    return NextResponse.json({ news })
  } catch (error) {
    console.error('Get news error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
