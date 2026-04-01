import { NextRequest } from 'next/server'
import { isAuthorizedCronRequest, runCronTask, unauthorizedCronResponse } from '@/lib/cron'

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return unauthorizedCronResponse()
  }

  return runCronTask('breaking')
}
