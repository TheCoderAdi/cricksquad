import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useGroupStore } from '../../store/groupStore'
import { HiOutlineBell, HiOutlineCog, HiChevronDown } from 'react-icons/hi'
import { GiCricketBat } from 'react-icons/gi'

const Navbar = () => {
    const { user } = useAuthStore()
    const { groups, currentGroup, setCurrentGroup } = useGroupStore()
    const [showDropdown, setShowDropdown] = useState(false)

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                {/* Logo */}
                <Link to="/dashboard" className="flex items-center gap-2">
                    <GiCricketBat className="text-2xl text-primary-600" />
                    <span className="font-display font-bold text-lg text-gray-900">
                        CrickSquad
                    </span>
                </Link>

                {/* Group Selector */}
                {currentGroup && (
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 rounded-lg text-sm font-medium text-primary-700"
                        >
                            {currentGroup.name}
                            <HiChevronDown className="text-lg" />
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                                {groups.map(group => (
                                    <button
                                        key={group._id}
                                        onClick={() => {
                                            setCurrentGroup(group)
                                            setShowDropdown(false)
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${currentGroup._id === group._id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                                            }`}
                                    >
                                        {group.name}
                                        <span className="text-xs text-gray-400 ml-2">
                                            {group.members?.length || 0} members
                                        </span>
                                    </button>
                                ))}
                                <div className="border-t border-gray-100 mt-2 pt-2">
                                    <Link
                                        to="/group/create"
                                        onClick={() => setShowDropdown(false)}
                                        className="block px-4 py-2 text-sm text-primary-600 hover:bg-primary-50"
                                    >
                                        + Create Group
                                    </Link>
                                    <Link
                                        to="/group/join"
                                        onClick={() => setShowDropdown(false)}
                                        className="block px-4 py-2 text-sm text-primary-600 hover:bg-primary-50"
                                    >
                                        🔗 Join Group
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Right icons */}
                <div className="flex items-center gap-3">
                    <Link to="/announcements" className="relative">
                        <HiOutlineBell className="text-xl text-gray-600" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                    </Link>
                    <Link to="/group/settings">
                        <HiOutlineCog className="text-xl text-gray-600" />
                    </Link>
                    <Link to="/profile">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                                <span className="text-sm font-bold text-primary-700">
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                </span>
                            )}
                        </div>
                    </Link>
                </div>
            </div>

            {/* Click outside to close */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </nav>
    )
}

export default Navbar