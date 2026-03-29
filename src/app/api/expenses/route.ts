import { NextRequest, NextResponse } from 'next/server';
import { getAllExpenses, addExpense } from '@/lib/google-sheets';

export async function GET() {
  try {
    const expenses = await getAllExpenses();
    return NextResponse.json({ success: true, data: expenses });
  } catch (error) {
    console.error('Expenses API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get expenses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, amount, date, paymentType } = body;

    if (!description || !amount) {
      return NextResponse.json(
        { success: false, error: 'Description and amount are required' },
        { status: 400 }
      );
    }

    const result = await addExpense({
      description,
      amount: amount.toString(),
      date: date || new Date().toLocaleDateString('en-GB'),
      paymentType: paymentType || 'online',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Add expense API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add expense' },
      { status: 500 }
    );
  }
}
