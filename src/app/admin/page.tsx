'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const [secretKey, setSecretKey] = useState('')
  const [triggerType, setTriggerType] = useState<'digest' | 'breaking'>('digest')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleTrigger = async () => {
    if (!secretKey) {
      setMessage('请输入管理员密钥')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretKey,
          type: triggerType,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage(`触发成功: ${data.message}`)
      } else {
        setMessage(`触发失败: ${data.error || data.message}`)
      }
    } catch (error) {
      setMessage('触发失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-sky-900 mb-4">管理后台</h1>
          <p className="text-gray-600">手动触发推送任务</p>
        </header>

        {/* Back Link */}
        <Link href="/" className="inline-block mb-8 text-sky-600 hover:text-sky-700">
          ← 返回首页
        </Link>

        {/* Admin Panel */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700 mb-2">
              管理员密钥
            </label>
            <input
              type="password"
              id="secretKey"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="输入管理员密钥"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">触发类型</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="digest"
                  checked={triggerType === 'digest'}
                  onChange={(e) => setTriggerType(e.target.value as 'digest')}
                  className="mr-2"
                />
                <span>定时摘要推送</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="breaking"
                  checked={triggerType === 'breaking'}
                  onChange={(e) => setTriggerType(e.target.value as 'breaking')}
                  className="mr-2"
                />
                <span>突发新闻监控</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleTrigger}
            disabled={loading}
            className="w-full py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '触发中...' : '触发任务'}
          </button>

          {message && (
            <div
              className={`mt-4 p-4 rounded-lg ${message.includes('成功') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
            >
              {message}
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>注意：</strong>此页面仅供管理员使用。手动触发任务会立即执行数据采集和邮件发送，请谨慎操作。
          </p>
        </div>
      </div>
    </main>
  )
}
