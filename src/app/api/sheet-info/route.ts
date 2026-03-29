import { NextResponse } from 'next/server';
import { getSheetInfo } from '@/lib/google-sheets';

export async function GET() {
  try {
    const info = await getSheetInfo();
    return NextResponse.json({ success: true, data: info });
  } catch (error) {
    console.error('Sheet info API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get sheet info' },
      { status: 500 }
    );
  }
}
