'use client'

import { useState } from 'react'
import Modal from '../ui/Modal'

interface AddChargeModalProps {
  isOpen: boolean
  onClose: () => void
  onChargeAdded: () => void
  billId: string
}

export default function AddChargeModal({
  isOpen,
  onClose,
  onChargeAdded,
  billId
}: AddChargeModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'EXTRA' // Default type for extra charges
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('Sending charge:', {
        billId,
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type
      })
      
      const response = await fetch(`/api/bills/${billId}/items/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          billId,
          description: formData.description,
          amount: parseFloat(formData.amount),
          type: formData.type
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add charge')
      }

      onChargeAdded()
      onClose()
      setFormData({
        description: '',
        amount: '',
        type: 'EXTRA'
      })
    } catch (error) {
      console.error('Error adding charge:', error)
      alert('Failed to add charge. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Extra Charge">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Add Extra Charge</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Room Service, Extra Towels"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="EXTRA">Extra Charge</option>
                <option value="SERVICE">Service</option>
                <option value="FOOD">Food & Beverage</option>
                <option value="AMENITY">Amenity</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
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
              {loading ? 'Adding...' : 'Add Charge'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
