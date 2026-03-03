import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';

interface UserRegistrationProps {
    onSwitchToLogin: () => void;
}

export const UserRegistration: React.FC<UserRegistrationProps> = ({ onSwitchToLogin }) => {
    const { register } = useAuth();
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        companyName: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        if (!form.email || !form.password || !form.firstName || !form.lastName) {
            setError('Please fill in all required fields.');
            return;
        }

        setIsSubmitting(true);
        try {
            await register({
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                password: form.password,
                companyName: form.companyName || undefined,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <Card className="w-full max-w-md p-6 space-y-6">
                <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-semibold">Create an account</h2>
                    <p className="text-sm text-muted-foreground">Join ASAgents to manage your construction projects.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="text-sm font-medium">
                            First name
                            <input
                                name="firstName"
                                value={form.firstName}
                                onChange={handleChange}
                                required
                                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </label>
                        <label className="text-sm font-medium">
                            Last name
                            <input
                                name="lastName"
                                value={form.lastName}
                                onChange={handleChange}
                                required
                                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </label>
                    </div>
                    <label className="text-sm font-medium">
                        Email
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </label>
                    <label className="text-sm font-medium">
                        Password
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            minLength={8}
                            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </label>
                    <label className="text-sm font-medium">
                        Company (optional)
                        <input
                            name="companyName"
                            value={form.companyName}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </label>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="flex flex-col gap-2">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating account…' : 'Create account'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={onSwitchToLogin}>
                            Back to login
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default UserRegistration;
