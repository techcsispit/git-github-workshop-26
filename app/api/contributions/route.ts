import { getContributions } from '@/lib/contributions';

// Fetched by the board after it has rendered, so counting never delays the page.
export async function GET() {
  return Response.json({ counts: await getContributions() }, { headers: { 'Cache-Control': 'no-store' } });
}
