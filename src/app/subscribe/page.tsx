'use client'

import { useState } from 'react'
import Link from 'next/link'
import { config, Category } from '@/lib/config'

export default function SubscribePage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([...config.defaultCategories])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const categories: Category[] = [...config.defaultCategories]

  const toggleCategory = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          categories: selectedCategories.join(','),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage('订阅成功！您将收到我们的智能简报。')
        setEmail('')
        setName('')
      } else {
        setMessage('订阅失败，请稍后重试。')
      }
    } catch (error) {
      setMessage('订阅失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-sky-900 mb-4">订阅 InfoPulse</h1>
          <p className="text-gray-600">获取 AI、科技、科学、水资源、政治、经济、加密货币与预测市场的情报简报</p>
        </header>

        <Link href="/" className="inline-block mb-8 text-sky-600 hover:text-sky-700">
          ← 返回首页
        </Link>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              邮箱地址 *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              姓名（可选）
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="您的姓名"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">关注的领域</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((category) => (
                <label
                  key={category}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                    selectedCategories.includes(category)
                      ? 'border-sky-600 bg-sky-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="mr-2"
                  />
                  <span className="text-sm">{config.categories[category]}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || selectedCategories.length === 0}
            className="w-full py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '订阅中...' : '立即订阅'}
          </button>

          {message && (
            <div
              className={`mt-4 p-4 rounded-lg ${message.includes('成功') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
            >
              {message}
            </div>
          )}
        </form>
      </div>
    </main>
  )
}
