import { auth } from '@/server/auth'

export async function POST(request: Request) {
  try {
    return await auth.handler(request)
  } catch (error: any) {
    console.error('❌ BETTER AUTH CRASH:', error)
    return Response.json(
      { error: error?.message || 'Internal Server Error', stack: error?.stack },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    return await auth.handler(request)
  } catch (error: any) {
    console.error('❌ BETTER AUTH CRASH:', error)
    return Response.json(
      { error: error?.message || 'Internal Server Error', stack: error?.stack },
      { status: 500 },
    )
  }
}
