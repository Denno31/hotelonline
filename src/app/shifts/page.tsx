import { Metadata } from 'next'
import ShiftManager from '@/components/shifts/ShiftManager'

export const metadata: Metadata = {
  title: 'Shift Management',
  description: 'Manage your work shifts',
}

export default function ShiftsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Shift Management</h1>
      <ShiftManager />
    </div>
  )
}
