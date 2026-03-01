import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import matchService from '../services/matchService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { HiX } from 'react-icons/hi'
import { startTransition } from 'react'
import { motion as Motion } from 'framer-motion'
import { useGroupStore } from '../store/groupStore'

const GalleryPage = () => {
    const { matchId } = useParams()
    const { isCurrentUserAdmin } = useGroupStore()
    const fileRef = useRef()
    const [match, setMatch] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [selectedPhoto, setSelectedPhoto] = useState(null)


    const loadMatch = async () => {
        try {
            const { data } = await matchService.getById(matchId)
            setMatch(data.data)
        } catch (error) {
            toast.error(`${error.response?.data?.message || 'Failed to load gallery'}`)
        }
        setIsLoading(false)
    }
    useEffect(() => {
        startTransition(() => {
            loadMatch()
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchId])

    const handleUpload = async (e) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploading(true)
        const formData = new FormData()
        for (let i = 0; i < files.length; i++) {
            formData.append('photos', files[i])
        }

        try {
            await matchService.uploadPhotos(matchId, formData)
            toast.success(`${files.length} photo(s) uploaded! 📸`)
            loadMatch()
        } catch (error) {
            toast.error(`${error.response?.data?.message || 'Upload failed'}`)
        }
        setUploading(false)
    }

    if (isLoading) return <LoadingSpinner message="Loading gallery..." />

    const photos = match?.photos || []

    return (
        <div className="space-y-5">
            <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <h1 className="text-xl font-display font-bold text-gray-900">Match Gallery</h1>
                {
                    isCurrentUserAdmin() && (
                        <button
                            onClick={() => fileRef.current?.click()}
                            className={`btn-primary ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading...' : 'Upload Photos'}
                        </button>
                    )
                }
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUpload}
                    className="hidden"
                />
            </Motion.div>

            {photos.length > 0 ? (
                <Motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-3 gap-2"
                >
                    {photos.map((photo, i) => (
                        <Motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="aspect-square rounded-xl overflow-hidden cursor-pointer"
                            onClick={() => setSelectedPhoto(photo)}
                        >
                            <img
                                src={photo.url}
                                alt=""
                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                            />
                        </Motion.div>
                    ))}
                </Motion.div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-5xl mb-3">📸</p>
                    <p className="text-gray-500 mb-4">No photos yet</p>
                    {
                        isCurrentUserAdmin() && (
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="btn-primary text-sm"
                            >
                                Upload First Photo
                            </button>
                        )
                    }
                </div>
            )}

            {/* Photo Viewer */}
            {selectedPhoto && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button className="absolute top-4 right-4 text-white p-2">
                        <HiX className="text-2xl" />
                    </button>
                    <img
                        src={selectedPhoto.url}
                        alt=""
                        className="max-w-full max-h-full rounded-xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    )
}

export default GalleryPage