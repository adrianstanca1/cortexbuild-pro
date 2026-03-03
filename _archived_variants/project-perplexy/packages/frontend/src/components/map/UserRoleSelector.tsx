import { User, Shield, HardHat } from 'lucide-react'

type UserRole = 'manager' | 'foreman' | 'labour'

interface UserRoleSelectorProps {
    role: UserRole
    onChange: (role: UserRole) => void
    userName: string
    onUserNameChange: (name: string) => void
}

export default function UserRoleSelector({
    role,
    onChange,
    userName,
    onUserNameChange,
}: UserRoleSelectorProps) {
    return (
        <div className="flex items-center space-x-4">
            {/* User Name Input */}
            <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-300 font-medium">Name:</label>
                <input
                    type="text"
                    value={userName}
                    onChange={(e) => onUserNameChange(e.target.value)}
                    className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 transition-colors font-medium min-w-[120px]"
                    placeholder="Your name"
                />
            </div>

            {/* Role Selector */}
            <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-300">Role:</label>
                <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
                    <button
                        onClick={() => onChange('manager')}
                        className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center space-x-1 ${role === 'manager'
                            ? 'bg-black text-white'
                            : 'text-gray-300 hover:bg-gray-600'
                            }`}
                        title="Manager"
                    >
                        <Shield className="w-4 h-4" />
                        <span>Manager</span>
                    </button>
                    <button
                        onClick={() => onChange('foreman')}
                        className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center space-x-1 ${role === 'foreman'
                            ? 'bg-orange-500 text-white'
                            : 'text-gray-300 hover:bg-gray-600'
                            }`}
                        title="Foreman"
                    >
                        <HardHat className="w-4 h-4" />
                        <span>Foreman</span>
                    </button>
                    <button
                        onClick={() => onChange('labour')}
                        className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center space-x-1 ${role === 'labour'
                            ? 'bg-green-500 text-white'
                            : 'text-gray-300 hover:bg-gray-600'
                            }`}
                        title="Labour"
                    >
                        <User className="w-4 h-4" />
                        <span>Labour</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

