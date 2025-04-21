import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';

const secretKey = process.env.NEXT_PUBLIC_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function decryptJSON(ciphertext: string | CryptoJS.lib.CipherParams) {
  if (!ciphertext) throw new Error("No ciphertext provided");
  const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  if (!decrypted) throw new Error("Decryption failed");

  return JSON.parse(decrypted);
}

// Error handler utility
const handleError = (error: any, message: string) => {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status: 500 });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, result } = body;
    const decoded = decryptJSON(result.text);

    if(decoded.expiry-Date.now()>5000){
        return NextResponse.json({ error: "Too Late, QR Auth Failed!!" }, { status: 500 });
    }

    const { data: users, error: userError } = await supabase
        .from('User')
        .select("*")
        .eq('id', userId)
        .single();

    const { data: otps, error: otpError } = await supabase
        .from('Authentication')
        .select("*")
        .eq('otp', decoded.otp)
        .eq('userId', decoded.employeeId)
        .eq('type', "ATTENDANCE")
        .single();

    if (otpError) {
      return handleError(otpError, 'Failed to save OTP');
    }

    if(!otps){
        return NextResponse.json({ error: "Wrong OTP, QR Auth Failed!!" }, { status: 500 });
    }

    return NextResponse.json({ message: "Attendance Marked successfully for Employee number: " + (users.employeeNumber).toString() + "!!" });

  } catch (error) {
    return handleError(error, 'Internal server error');
  }
}