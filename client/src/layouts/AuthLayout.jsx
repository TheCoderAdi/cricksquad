import { Outlet } from 'react-router-dom'

const AuthLayout = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-green-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Outlet />
            </div>
        </div>
    )
}

export default AuthLayout