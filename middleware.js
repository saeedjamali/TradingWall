import { NextResponse } from 'next/server'

/** Enamad: answer /74164599.txt even if static public serve fails */
export function middleware(request) {
  const { pathname } = request.nextUrl

  if (pathname === '/74164599.txt') {
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
  // Explicit string + regex (dot can be tricky in matchers)
  matcher: ['/74164599.txt', '/74164599\\.txt'],
}
