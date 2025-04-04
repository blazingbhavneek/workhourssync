import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

const sendOTP = async (email: string, employeeNumber: string) => {
    try {
        // Generate OTP using speakeasy TOTP
        const otp = speakeasy.totp({
            secret: speakeasy.generateSecret({ length: 20 }).base32, // Dynamic secret
            encoding: 'base32',
        });

        // Set expiry time (5 minutes)
        const otpExpiry = Date.now() + 5 * 60 * 1000;

        // Store OTP and expiry in the database
        await prisma.user.update({
            where: { employeeNumber },
            data: { otp, otpExpiry },
        });

        // Set up the transporter for sending email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'umeshkumar@iitdalumni.com', // Replace with your Gmail address
                pass: 'FcjdrVxJXh8cFXu',      // Replace with your Gmail app password
            },
        });

        // Send the OTP to the provided email address
        await transporter.sendMail({
            from: '"Your Company" <your-email@gmail.com>',
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is: ${otp}`,
        });

        return otp;
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw new Error('Failed to send OTP');
    }
};

export async function POST(req: Request) {
    try {
        const { employeeNumber, password, email, otp, fingerprintHash, isMobile } = await req.json();

        console.log('Received login request:', { employeeNumber, password, email, otp, fingerprintHash, isMobile });

        // Fetch the user from the database
        const user = await prisma.user.findUnique({
            where: { employeeNumber },
        });

        if (!user) {
            console.error('User not found:', employeeNumber);
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 400 });
        }

        // Check if the provided email matches the stored email
        if (email !== user.email) {
            console.error('Email mismatch:', email);
            return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400 });
        }

        // Compare the entered password with the stored hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            console.error('Invalid password for user:', employeeNumber);
            return new Response(JSON.stringify({ error: 'Invalid password' }), { status: 400 });
        }

        // Handle mobile login with fingerprint
        if (isMobile && fingerprintHash) {
            if (user.fingerprintHash && user.fingerprintHash !== fingerprintHash) {
                console.error('Fingerprint mismatch for user:', employeeNumber);
                return new Response(JSON.stringify({ error: 'Invalid fingerprint' }), { status: 400 });
            }
            // Store fingerprint hash if not already set
            if (!user.fingerprintHash) {
                await prisma.user.update({
                    where: { employeeNumber },
                    data: { fingerprintHash },
                });
            }
            return new Response(JSON.stringify({ message: 'Login successful via fingerprint' }), { status: 200 });
        }

        // If OTP is not provided and not mobile, send the OTP
        if (!otp && !isMobile) {
            console.log('Sending OTP to email:', email);
            const generatedOtp = await sendOTP(user.email, employeeNumber);
            return new Response(
                JSON.stringify({ message: 'OTP sent to your email', otp: generatedOtp }),
                { status: 200 }
            );
        }

        // OTP Validation (for non-mobile login)
        if (!user.otp || !user.otpExpiry || Date.now() > user.otpExpiry) {
            console.error('OTP expired or invalid OTP:', otp);
            return new Response(
                JSON.stringify({ error: 'OTP has expired or is invalid' }),
                { status: 400 }
            );
        }

        if (otp !== user.otp) {
            console.error('Invalid OTP:', otp);
            return new Response(JSON.stringify({ error: 'Invalid OTP' }), { status: 400 });
        }

        // OTP is valid, clear OTP fields
        await prisma.user.update({
            where: { employeeNumber },
            data: { otp: null, otpExpiry: null },
        });

        // Return success
        return new Response(JSON.stringify({ message: 'Login successful' }), { status: 200 });
    } catch (error) {
        console.error('Error during login:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}