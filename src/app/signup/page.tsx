'use client';

import { useState } from 'react';

export default function SignUpPage() {
    // State hooks to manage user inputs
    const [employeeNumber, setEmployeeNumber] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Handle form submission
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employeeNumber,
                password,
                email,
            }),
        });

        const data = await res.json();

        if (res.ok) {
            setSuccess('Sign-up successful! You can now log in.');
            setError('');
        } else {
            setError(data.error);
            setSuccess('');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-center mb-6">Sign Up</h2>

                {/* Show success message */}
                {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

                {/* Show error message */}
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <form onSubmit={handleSignUp}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700" htmlFor="employeeNumber">
                            Employee Number
                        </label>
                        <input
                            type="text"
                            id="employeeNumber"
                            value={employeeNumber}
                            onChange={(e) => setEmployeeNumber(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your employee number"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:ring-4 focus:ring-blue-200 focus:outline-none"
                    >
                        Sign Up
                    </button>
                </form>
            </div>
        </div>
    );
}