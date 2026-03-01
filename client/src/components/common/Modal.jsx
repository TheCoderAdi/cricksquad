import { motion as Motion, AnimatePresence } from 'framer-motion'
import { HiX } from 'react-icons/hi'

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl'
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed -top-10 left-0 right-0 bottom-0 bg-black/50 z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <Motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.95 }}
                        transition={{ type: 'spring', duration: 0.3 }}
                        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl ${sizeClasses[size]} mx-auto max-h-[85vh] overflow-y-auto`}
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <HiX className="text-xl text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-4 pb-8">
                            {children}
                        </div>
                    </Motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

export default Modal