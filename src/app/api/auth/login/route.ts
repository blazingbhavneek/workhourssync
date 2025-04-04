import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        // Parse the JSON body from the request
        const { employeeNumber, password, email } = await req.json();

        // Fetch the user from the database using Prisma
        const user = await prisma.user.findUnique({
            where: { employeeNumber },
        });

        // If no user is found, return an error
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 400 });
        }

        // Check if the provided email matches the stored email
        if (email !== user.email) {
            return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400 });
        }

        // Compare the entered password with the stored hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return new Response(JSON.stringify({ error: 'Invalid password' }), { status: 400 });
        }

        // If the employee number, password, and email all match, return success
        return new Response(JSON.stringify({ message: 'Login successful' }), { status: 200 });

    } catch (error) {
        // Handle any unexpected errors and return a server error
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}