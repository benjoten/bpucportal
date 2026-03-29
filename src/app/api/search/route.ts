import { NextRequest, NextResponse } from 'next/server';
import { searchNames, getAllNames } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');

    if (name && name.trim() !== '') {
      const results = await searchNames(name.trim());
      return NextResponse.json({ success: true, data: results });
    } else {
      // Return all names if no search term
      const results = await getAllNames();
      return NextResponse.json({ success: true, data: results });
    }
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search names' },
      { status: 500 }
    );
  }
}
