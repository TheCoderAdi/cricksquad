import { Outlet } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import BottomNav from '../components/common/BottomNav'

const AppLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="pb-24 pt-4 px-4 max-w-lg mx-auto">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    )
}

export default AppLayout