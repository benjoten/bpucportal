import { NextResponse } from 'next/server';
import { getCollectionStats } from '@/lib/google-sheets';

export async function GET() {
  try {
    const stats = await getCollectionStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get collection stats' },
      { status: 500 }
    );
  }
}
