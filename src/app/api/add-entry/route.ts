import { NextRequest, NextResponse } from 'next/server';
import { addNewEntry, NewEntryData } from '@/lib/google-sheets';

// Add new entry to Google Sheet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, amount, paymentType, paymentDate } = body as NewEntryData;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const result = await addNewEntry({
      name: name.trim(),
      address: address?.trim() || '',
      amount: amount || '',
      paymentType: paymentType,
      paymentDate: paymentDate || (amount ? new Date().toLocaleDateString('en-GB') : ''),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Entry added successfully',
      rowIndex: result.rowIndex
    });
  } catch (error) {
    console.error('Add entry API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add new entry' },
      { status: 500 }
    );
  }
}
