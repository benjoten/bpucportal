import { NextRequest, NextResponse } from 'next/server';
import { updateStatus } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rowIndex, status } = body;

    if (!rowIndex) {
      return NextResponse.json(
        { success: false, error: 'Row index is required' },
        { status: 400 }
      );
    }

    const result = await updateStatus(rowIndex, status || '');
    
    return NextResponse.json({ success: result });
  } catch (error) {
    console.error('Update status API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
