import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Error handler utility
const handleError = (error: any, message: string) => {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status: 500 });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    const { data: users, error: userError } = await supabase
        .from('User')
        .select("*")
        .eq('id', userId)
        .single();

    console.log(users);
    // Generate OTP (6 digits)
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 60000); // 1 minute

    // Store OTP in Authentication table
    const { error: otpError } = await supabase
      .from('Authentication')
      .insert([{
        userId: users.employeeNumber, // Fixed: Removed quotes around column name
        otp: generatedOtp,
        otpExpiry: otpExpiry.toISOString(),
        type: 'ATT',
        isUsed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]);

    if (otpError) {
      return handleError(otpError, 'Failed to save OTP');
    }

    return NextResponse.json({ employeeNumber: users.employeeNumber, otp: generatedOtp });

  } catch (error) {
    return handleError(error, 'Internal server error');
  }
}