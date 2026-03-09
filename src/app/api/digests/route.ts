import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 获取历史推送记录
export async function GET() {
  try {
    const digests = await prisma.digest.findMany({
      take: 20,
      orderBy: { sentAt: 'desc' },
      include: {
        newsItems: {
          take: 10,
          orderBy: { importance: 'desc' },
        },
      },
    })

    return NextResponse.json({ digests })
  } catch (error) {
    console.error('Get digests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
