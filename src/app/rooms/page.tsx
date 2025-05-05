'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AddRoomModal from '@/components/rooms/AddRoomModal'

interface Room {
  id: string
  number: string
  type: string
  rate: number
  status: string
  checkIns: Array<{
    guest: {
      firstName: string
      lastName: string
    }
  }>
}

export default function RoomsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms')
      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        setRooms(result.data)
      } else {
        setRooms([])
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
      setRooms([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800'
      case 'OCCUPIED':
        return 'bg-red-100 text-red-800'
      case 'RESERVED':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
        {session?.user.role === 'ADMIN' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Room
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">Room {room.number}</h3>
                <p className="text-gray-600">{room.type}</p>
                <p className="text-gray-600">${room.rate}/night</p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-sm ${getStatusColor(
                  room.status
                )}`}
              >
                {room.status}
              </span>
            </div>

            {room.status === 'OCCUPIED' && room.checkIns[0] && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Current Guest: {room.checkIns[0].guest.firstName}{' '}
                  {room.checkIns[0].guest.lastName}
                </p>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {/* TODO: Implement check-in flow */}}
                disabled={room.status !== 'AVAILABLE'}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Check In
              </button>
            </div>
          </div>
        ))}
      </div>

      <AddRoomModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={fetchRooms}
      />
    </div>
  )
}
