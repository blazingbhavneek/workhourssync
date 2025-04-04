import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        // Parse the request body
        const { employeeNumber, password, email } = await req.json();

        // Check if the user already exists
        const existingUser = await prisma.user.findUnique({
            where: { employeeNumber },
        });

        if (existingUser) {
            return new Response(JSON.stringify({ error: 'Employee number already exists' }), { status: 400 });
        }

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the new user in the database
        const newUser = await prisma.user.create({
            data: {
                employeeNumber,
                password: hashedPassword,
                email,
            },
        });

        // Respond with a success message
        return new Response(JSON.stringify({ message: 'User created successfully' }), { status: 200 });

    } catch (error) {
        // Handle any unexpected errors
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}