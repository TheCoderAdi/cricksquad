import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import matchService from '../services/matchService'
import venueService from '../services/venueService'
import { useGroupStore } from '../store/groupStore'
import Modal from '../components/common/Modal'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { format } from 'date-fns'
import { HiLocationMarker, HiPhone, HiClock, HiCurrencyRupee, HiExternalLink } from 'react-icons/hi'

const VenuePage = () => {
    const { matchId } = useParams()
    const [match, setMatch] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [venueData, setVenueData] = useState(null)
    const { currentGroup, isCurrentUserAdmin } = useGroupStore()

    const [showManage, setShowManage] = useState(false)
    const [venuesList, setVenuesList] = useState([])
    const [form, setForm] = useState({ name: '', address: '', phone: '', pricePerHour: '', googleMapsLink: '', facilities: '' })
    const [editingId, setEditingId] = useState(null)

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await matchService.getById(matchId)
                setMatch(data.data)
                const v = data.data?.venue
                const venueId = v?._id || (typeof v === 'string' ? v : null)
                if (venueId) {
                    try {
                        const { data: venueResp } = await venueService.getById(venueId)
                        setVenueData(venueResp.data)
                    } catch (err) {
                        console.warn('Failed to load venue via venueService', err)
                    }
                }
                try {
                    const groupId = data.data?.group || data.data?.group?._id || currentGroup?._id
                    if (groupId) {
                        const { data: vg } = await venueService.getByGroup(groupId)
                        setVenuesList(vg.data || [])
                    }
                } catch {
                    // nothing
                }
            } catch (e) {
                console.error('Failed to load match details', e)
            }
            setIsLoading(false)
        }
        load()
    }, [currentGroup?._id, matchId])

    if (isLoading) return <LoadingSpinner />
    if (!match) return <div className="text-center py-10">Match not found</div>

    const venue = venueData || match.venue

    const openManage = async () => {
        setShowManage(true)
        try {
            const groupId = match.group?._id || match.group || currentGroup?._id
            if (!groupId) return
            const { data } = await venueService.getByGroup(groupId)
            setVenuesList(data.data || [])
        } catch (err) {
            toast.error(`${err.response?.data?.message || 'Failed to load venues'}`)
        } finally {
            // finished loading venues for management
        }
    }

    const resetForm = () => setForm({ name: '', address: '', phone: '', pricePerHour: '', googleMapsLink: '', facilities: '' })

    const handleEdit = (v) => {
        setEditingId(v._id)
        setForm({ name: v.name || '', address: v.address || '', phone: v.phone || '', pricePerHour: v.pricePerHour || '', googleMapsLink: v.googleMapsLink || '', facilities: (v.facilities || []).join(',') })
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this venue?')) return
        try {
            await venueService.delete(id)
            toast.success('Venue deleted')
            setVenuesList(prev => prev.filter(x => x._id !== id))
            if (venueData && venueData._id === id) setVenueData(null)
        } catch (err) {
            toast.error(`${err.response?.data?.message || 'Failed to delete venue'}`)
        }
    }

    const handleSubmitForm = async () => {
        const payload = {
            name: form.name,
            address: form.address,
            phone: form.phone,
            pricePerHour: Number(form.pricePerHour) || 0,
            googleMapsLink: form.googleMapsLink,
            facilities: form.facilities ? form.facilities.split(',').map(s => s.trim()) : [],
            group: match.group?._id || match.group || currentGroup?._id
        }
        try {
            if (editingId) {
                const { data } = await venueService.update(editingId, payload)
                toast.success('Venue updated')
                setVenuesList(prev => prev.map(v => v._id === editingId ? data.data : v))
                setVenueData(data.data)
            } else {
                const { data } = await venueService.create(payload)
                toast.success('Venue created')
                setVenuesList(prev => [data.data, ...prev])
                setVenueData(data.data)
            }
            resetForm()
            setEditingId(null)
        } catch (err) {
            toast.error(`${err.response?.data?.message || 'Failed to save venue'}`)
        }
    }

    return (
        <div className="space-y-5">
            <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-xl font-display font-bold text-gray-900">📍 Match Details</h1>
            </Motion.div>

            {/* Match Info */}
            <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="card"
            >
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <HiClock className="text-primary-600 text-xl" />
                        <div>
                            <p className="font-medium text-gray-900">{format(new Date(match.date), 'EEEE, MMMM d, yyyy')}</p>
                            <p className="text-sm text-gray-500">{match.time}</p>
                        </div>
                    </div>

                    {venue && (
                        <>
                            <div className="flex items-center gap-3">
                                <HiLocationMarker className="text-red-500 text-xl" />
                                <div>
                                    <p className="font-medium text-gray-900">{venue.name}</p>
                                    <p className="text-sm text-gray-500">{venue.address}</p>
                                </div>
                            </div>

                            {venue.phone && (
                                <div className="flex items-center gap-3">
                                    <HiPhone className="text-blue-500 text-xl" />
                                    <a href={`tel:${venue.phone}`} className="text-sm text-blue-600 font-medium">
                                        {venue.phone}
                                    </a>
                                </div>
                            )}

                            {venue.pricePerHour > 0 && (
                                <div className="flex items-center gap-3">
                                    <HiCurrencyRupee className="text-green-500 text-xl" />
                                    <p className="text-sm text-gray-700">₹{venue.pricePerHour}/hour</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Motion.div>

            {/* Map Link */}
            {venue?.googleMapsLink && (
                <Motion.a
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    href={venue.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card flex items-center justify-between hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            🗺️
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Open in Google Maps</p>
                            <p className="text-xs text-gray-500">Get directions to the venue</p>
                        </div>
                    </div>
                    <HiExternalLink className="text-gray-400 text-xl" />
                </Motion.a>
            )}

            {/* Facilities */}
            {venue?.facilities?.length > 0 && (
                <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="card"
                >
                    <h3 className="font-bold text-gray-900 mb-3">🏟️ Facilities</h3>
                    <div className="flex flex-wrap gap-2">
                        {venue.facilities.map((f, i) => {
                            const facilityIcons = {
                                parking: '🅿️', washroom: '🚻', floodlights: '💡',
                                drinking_water: '💧', changing_room: '👔', equipment: '🏏',
                                first_aid: '🩹', canteen: '🍽️'
                            }
                            return (
                                <span key={i} className="badge bg-gray-100 text-gray-700 text-xs capitalize">
                                    {facilityIcons[f] || '✅'} {f.replace('_', ' ')}
                                </span>
                            )
                        })}
                    </div>
                </Motion.div>
            )}

            {/* Admin: Manage Venues */}
            {typeof isCurrentUserAdmin === 'function' && isCurrentUserAdmin() && (
                <div>
                    <button
                        onClick={openManage}
                        className="btn-primary mt-2"
                    >
                        Manage Venues
                    </button>
                </div>
            )}

            <Modal isOpen={showManage} onClose={() => { setShowManage(false); resetForm(); setEditingId(null); }} title="Manage Venues">
                <div className="space-y-4">
                    <div>
                        <h4 className="font-bold mb-2">Existing Venues</h4>
                        {venuesList.length === 0 ? (
                            <p className="text-sm text-gray-500">No venues for this group yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {venuesList.map(v => (
                                    <div key={v._id} className="flex items-center justify-between p-2 border rounded">
                                        <div>
                                            <p className="font-medium">{v.name}</p>
                                            <p className="text-xs text-gray-500">{v.address}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleEdit(v)} className="text-sm bg-yellow-50 px-2 py-1 rounded">Edit</button>
                                            <button onClick={() => handleDelete(v._id)} className="text-sm bg-red-50 px-2 py-1 rounded">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <h4 className="font-bold mb-2">{editingId ? 'Edit Venue' : 'Create Venue'}</h4>
                        <div className="space-y-2">
                            <input className="input-field" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            <input className="input-field" placeholder="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                            <input className="input-field" placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                            <input className="input-field" placeholder="Price per hour" value={form.pricePerHour} onChange={e => setForm(f => ({ ...f, pricePerHour: e.target.value }))} />
                            <input className="input-field" placeholder="Google Maps Link" value={form.googleMapsLink} onChange={e => setForm(f => ({ ...f, googleMapsLink: e.target.value }))} />
                            <input className="input-field" placeholder="Facilities (comma separated)" value={form.facilities} onChange={e => setForm(f => ({ ...f, facilities: e.target.value }))} />
                            <div className="flex gap-2">
                                <button onClick={handleSubmitForm} className="btn-primary">{editingId ? 'Save' : 'Create'}</button>
                                <button onClick={() => { resetForm(); setEditingId(null); }} className="btn-secondary">Reset</button>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default VenuePage