import { NextRequest, NextResponse } from 'next/server';
import { updatePayment, UpdatePaymentData } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rowIndex, amount, paymentType, paymentDate, status, givenAmount, returnAmount, returnAmountType } = body;

    // Validate input
    if (!rowIndex || typeof rowIndex !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Row index is required' },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Amount is required' },
        { status: 400 }
      );
    }

    if (!paymentType || !['cash', 'online'].includes(paymentType)) {
      return NextResponse.json(
        { success: false, error: 'Payment type must be cash or online' },
        { status: 400 }
      );
    }

    await updatePayment({ 
      rowIndex, 
      amount, 
      paymentType,
      paymentDate: paymentDate || new Date().toLocaleDateString('en-GB'),
      status: status || 'Paid',
      givenAmount,
      returnAmount,
      returnAmountType,
    } as UpdatePaymentData);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Payment updated successfully' 
    });
  } catch (error) {
    console.error('Update payment API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}
