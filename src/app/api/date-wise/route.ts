import { NextResponse } from 'next/server';
import { getDateWiseCollection } from '@/lib/google-sheets';

export async function GET() {
  try {
    const data = await getDateWiseCollection();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Date-wise API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get date-wise collection' },
      { status: 500 }
    );
  }
}
