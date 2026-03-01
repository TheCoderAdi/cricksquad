import { GiCricketBat } from 'react-icons/gi'

const LoadingSpinner = ({ message = 'Loading...' }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-primary-200 rounded-full animate-spin border-t-primary-600" />
                <GiCricketBat className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-600 text-xl" />
            </div>
            <p className="mt-4 text-gray-500 text-sm font-medium">{message}</p>
        </div>
    )
}

export default LoadingSpinner