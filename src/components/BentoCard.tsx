import React from 'react';
import { LucideIcon } from 'lucide-react';

interface BentoCardProps {
    title: string;
    description: string;
    icon?: LucideIcon | React.ReactNode;
    className?: string;
    children?: React.ReactNode;
    variant?: 'default' | 'hero' | 'dark' | 'glass';
}

export const BentoCard: React.FC<BentoCardProps> = ({
    title,
    description,
    icon: Icon,
    className = "",
    children,
    variant = 'default'
}) => {
    const variants = {
        default: "bg-white border-gray-100 hover:border-indigo-100 shadow-xl",
        hero: "bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-2xl",
        dark: "bg-gray-900 border-white/5 text-white shadow-2xl",
        glass: "bg-white/5 backdrop-blur-xl border-white/10 text-white shadow-2xl"
    };

    const renderIcon = () => {
        if (!Icon) return null;

        const iconClasses = `w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 ${variant === 'hero' ? 'bg-white/10 text-white' :
            variant === 'dark' ? 'bg-white/5 text-indigo-400' :
                variant === 'glass' ? 'bg-indigo-500/20 text-indigo-300' :
                    'bg-indigo-50 text-indigo-600'
            }`;

        return (
            <div className={iconClasses}>
                {typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null && 'render' in Icon)
                    ? React.createElement(Icon as any, { size: 28 })
                    : Icon}
            </div>
        );
    };

    return (
        <div className={`rounded-[48px] p-10 border transition-all group overflow-hidden relative ${variants[variant]} ${className}`}>
            {renderIcon()}
            <div className="relative z-10">
                <h3 className={`text-2xl font-black mb-4 tracking-tight uppercase ${variant === 'hero' ? 'text-white' :
                    variant === 'default' ? 'text-gray-900' : 'text-white'
                    }`}>
                    {title}
                </h3>
                <p className={`font-medium leading-relaxed ${variant === 'hero' ? 'text-indigo-50' :
                    variant === 'default' ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                    {description}
                </p>
                {children && <div className="mt-8">{children}</div>}
            </div>

            {/* Decorative background for hero/dark */}
            {(variant === 'hero' || variant === 'dark') && Icon && (typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null && 'render' in Icon)) && (
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    {React.createElement(Icon as any, { size: 180 })}
                </div>
            )}
        </div>
    );
};
