'use client'

import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'

interface Company {
  id: string
  name: string
}

interface Room {
  id: string
  number: string
  type: string
  rate: number
  status: string
}

interface Guest {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  companyId?: string
}

interface CheckInModalProps {
  isOpen: boolean
  onClose: () => void
  onCheckIn: () => void
  selectedRoomId?: string
}

export default function CheckInModal({
  isOpen,
  onClose,
  onCheckIn,
  selectedRoomId
}: CheckInModalProps) {
  const [guests, setGuests] = useState<Guest[]>([])
  const [formData, setFormData] = useState({
    guestId: '',
    roomId: selectedRoomId || '',
    checkOutDate: '',
    // Guest details (for display only)
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    isCompany: false,
    companyId: ''
  })

  const [companies, setCompanies] = useState<Company[]>([])
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchGuests()
      fetchCompanies()
      if (!selectedRoomId) {
        fetchAvailableRooms()
      }
    }
  }, [isOpen, selectedRoomId])

  const fetchGuests = async () => {
    try {
      const response = await fetch('/api/guests')
      const data = await response.json()
      setGuests(data)
    } catch (error) {
      console.error('Error fetching guests:', error)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      const data = await response.json()
      setCompanies(data)
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchAvailableRooms = async () => {
    try {
      const response = await fetch('/api/rooms')
      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        setAvailableRooms(result.data.filter((room: Room) => room.status === 'AVAILABLE'))
      } else {
        setAvailableRooms([])
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
      setAvailableRooms([])
    }
  }

  const resetForm = () => {
    setFormData({
      guestId: '',
      roomId: selectedRoomId || '',
      checkOutDate: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      isCompany: false,
      companyId: ''
    })
  }

  interface CheckInResponse {
    success: boolean
    data?: {
      id: string
      guestId: string
      roomId: string
      checkInDate: string
      checkOutDate: string | null
      status: string
      guest: {
        firstName: string
        lastName: string
        email: string | null
      }
      room: {
        number: string
        type: string
      }
    }
    error?: string
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create initial bill
      const billResponse = await fetch('/api/bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guestId: formData.guestId,
          companyId: formData.companyId || undefined,
          roomId: formData.roomId,
          checkInDate: new Date().toISOString(),
          checkOutDate: formData.checkOutDate || undefined,
          status: 'PENDING'
        })
      })

      if (!billResponse.ok) {
        throw new Error('Failed to create bill')
      }

      const bill = await billResponse.json()

      // Create check-in
      const response = await fetch('/api/check-ins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guestId: formData.guestId,
          roomId: formData.roomId,
          checkInDate: new Date().toISOString(),
          checkOutDate: formData.checkOutDate || null
        })
      })

      const result: CheckInResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create check-in')
      }

      onCheckIn()
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error creating check-in:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Check-in">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Select Guest
          </label>
          <select
            required
            value={formData.guestId}
            onChange={(e) => {
              const guest = guests.find((g) => g.id === e.target.value)
              if (guest) {
                setFormData({
                  ...formData,
                  guestId: guest.id,
                  firstName: guest.firstName,
                  lastName: guest.lastName,
                  email: guest.email,
                  phone: guest.phone,
                  address: guest.address,
                  isCompany: !!guest.companyId,
                  companyId: guest.companyId || ''
                })
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select a guest</option>
            {guests.map((guest) => (
              <option key={guest.id} value={guest.id}>
                {guest.firstName} {guest.lastName}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {!selectedRoomId && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Room
            </label>
            <select
              required
              value={formData.roomId}
              onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a room</option>
              {availableRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.number} - {room.type} (${room.rate}/night)
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Check-out Date (Optional)
          </label>
          <input
            type="date"
            value={formData.checkOutDate}
            onChange={(e) =>
              setFormData({ ...formData, checkOutDate: e.target.value })
            }
            min={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isCompany"
            checked={formData.isCompany}
            onChange={(e) =>
              setFormData({ ...formData, isCompany: e.target.checked })
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="isCompany"
            className="text-sm font-medium text-gray-700"
          >
            Company Guest
          </label>
        </div>

        {formData.isCompany && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Company
            </label>
            <select
              value={formData.companyId}
              onChange={(e) =>
                setFormData({ ...formData, companyId: e.target.value })
              }
              required={formData.isCompany}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Check In'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
