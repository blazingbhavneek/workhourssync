import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { employeeNumber, otp } = await req.json();

        // Fetch the user and their OTP details
        const user = await prisma.user.findUnique({
            where: { employeeNumber },
        });

        if (!user || !user.otp || !user.otpExpiry) {
            return new NextResponse(
                JSON.stringify({ error: 'No OTP found for this user' }),
                { status: 400 }
            );
        }

        // Validate OTP expiry
        if (Date.now() > user.otpExpiry) {
            return new NextResponse(
                JSON.stringify({ error: 'OTP has expired' }),
                { status: 400 }
            );
        }

        // Validate OTP
        if (otp !== user.otp) {
            return new NextResponse(
                JSON.stringify({ error: 'Invalid OTP' }),
                { status: 400 }
            );
        }

        // Clear OTP after successful verification
        await prisma.user.update({
            where: { employeeNumber },
            data: { otp: null, otpExpiry: null },
        });

        // Success
        return new NextResponse(
            JSON.stringify({ message: 'OTP verified successfully!' }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return new NextResponse(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500 }
        );
    }
}