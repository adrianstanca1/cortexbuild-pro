import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
    placeholder?: string
    onSearch: (query: string) => void
    debounceMs?: number
    className?: string
}

export default function SearchBar({
    placeholder = 'Search...',
    onSearch,
    debounceMs = 300,
    className = '',
}: SearchBarProps) {
    const [query, setQuery] = useState('')
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current)
        }

        debounceTimer.current = setTimeout(() => {
            onSearch(query)
        }, debounceMs)

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current)
            }
        }
    }, [query, onSearch, debounceMs])

    const handleClear = () => {
        setQuery('')
        onSearch('')
    }

    return (
        <div className={`relative ${className}`}>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500 text-white placeholder-gray-400"
            />
            {query && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>
    )
}

