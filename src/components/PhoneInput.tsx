import React, { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    className?: string;
}

interface Country {
    code: string;
    name: string;
    dial: string;
    flag: string;
}

const popularCountries: Country[] = [
    { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
    { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
    { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
    { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
    { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
    { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
    { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
];

export const PhoneInput: React.FC<PhoneInputProps> = ({
    value,
    onChange,
    required = false,
    className = '',
}) => {
    const [phoneNumber, setPhoneNumber] = useState(value || '');

    // Parse existing value on mount
    useEffect(() => {
        if (value && value !== phoneNumber) {
            setPhoneNumber(value);
        }
    }, [value]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value.replace(/[^\d\s()+-]/g, ''); // Allow digits, spaces, and common phone characters
        setPhoneNumber(input);
        onChange(input);
    };

    return (
        <div className={`w-full ${className}`}>
            <div className="relative group">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none group-focus-within:text-yellow-400 transition-colors" size={18} />
                <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="Phone number (optional)"
                    required={required}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-yellow-500/20 focus:border-transparent outline-none transition-all"
                    autoComplete="tel"
                />
            </div>
        </div>
    );
};

export default PhoneInput;

