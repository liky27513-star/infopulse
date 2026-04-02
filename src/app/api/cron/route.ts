import { NextRequest } from 'next/server'
import { isAuthorizedCronRequest, unauthorizedCronResponse, runCronTask, shouldRunDigestNow } from '@/lib/cron'

// Vercel Cron Jobs 端点
export async function GET(request: NextRequest) {
  if (!(await isAuthorizedCronRequest(request))) {
    return unauthorizedCronResponse()
  }

  const task = request.nextUrl.searchParams.get('task')
  if (task === 'digest' || task === 'breaking') {
    return runCronTask(task)
  }

  // 兼容旧配置：仍然允许 /api/cron 根据北京时间判断执行任务
  return shouldRunDigestNow() ? runCronTask('digest') : runCronTask('breaking')
}
