import { NavLink } from 'react-router-dom'
import { HiHome, HiCalendar, HiChartBar, HiUser } from 'react-icons/hi'

const navItems = [
    { to: '/dashboard', icon: HiHome, label: 'Home' },
    { to: '/polls', icon: HiCalendar, label: 'Polls' },
    { to: '/leaderboard', icon: HiChartBar, label: 'Stats' },
    { to: '/profile', icon: HiUser, label: 'Profile' },
]

const BottomNav = () => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
            <div className="max-w-lg mx-auto flex items-center justify-around py-2">
                {navItems.map((item) => {
                    const { to, label } = item
                    const Icon = item.icon

                    return (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${isActive
                                    ? 'text-primary-600'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon className={`text-xl ${isActive ? 'scale-110' : ''} transition-transform`} />
                                    <span className="text-xs font-medium">{label}</span>
                                    {isActive && (
                                        <div className="w-1 h-1 bg-primary-600 rounded-full" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    )
                })}
            </div>
        </nav>
    )
}

export default BottomNav