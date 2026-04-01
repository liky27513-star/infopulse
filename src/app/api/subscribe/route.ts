import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { config } from '@/lib/config'

// 订阅
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, categories } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // 检查是否已存在
    const existing = await prisma.subscriber.findUnique({
      where: { email },
    })

    if (existing) {
      // 更新订阅
      const updated = await prisma.subscriber.update({
        where: { email },
        data: {
          name: name || existing.name,
          categories: categories || existing.categories || config.defaultCategories.join(','),
          isActive: true,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Subscription updated',
        subscriber: updated,
      })
    }

    // 创建新订阅
    const subscriber = await prisma.subscriber.create({
      data: {
        email,
        name,
        categories: categories || config.defaultCategories.join(','),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Subscribed successfully',
      subscriber,
    })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 退订
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    await prisma.subscriber.update({
      where: { email },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed successfully',
    })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 获取订阅信息
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const subscriber = await prisma.subscriber.findUnique({
      where: { email },
    })

    if (!subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 })
    }

    return NextResponse.json({ subscriber })
  } catch (error) {
    console.error('Get subscriber error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
