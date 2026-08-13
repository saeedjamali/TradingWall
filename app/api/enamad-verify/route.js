/**
 * Enamad verification helper (optional; prefer nginx return 200 for /74164599.txt)
 * GET /api/enamad-verify
 */
export async function GET() {
  return new Response('74164599', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, must-revalidate',
    },
  })
}
