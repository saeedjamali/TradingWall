import { NextResponse } from 'next/server'

/** Enamad verification file — must answer at /74164599.txt */
export function middleware(request) {
  if (request.nextUrl.pathname === '/74164599.txt') {
    return new NextResponse('74164599', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/74164599.txt'],
}
