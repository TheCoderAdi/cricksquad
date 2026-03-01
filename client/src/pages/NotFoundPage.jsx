import { Link } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'

const NotFoundPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <p className="text-8xl mb-4">🏏</p>
                <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Howzat!</h1>
                <p className="text-gray-500 mb-6">That page went for a six — out of bounds!</p>
                <Link to="/dashboard" className="btn-primary">
                    Back to Dashboard
                </Link>
            </Motion.div>
        </div>
    )
}

export default NotFoundPage