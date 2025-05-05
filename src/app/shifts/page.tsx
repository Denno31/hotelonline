import { Metadata } from 'next'
import ShiftManager from '@/components/shifts/ShiftManager'
import { AdvanceDay } from '@/components/system/AdvanceDay'

export const metadata: Metadata = {
  title: 'Shift Management',
  description: 'Manage your work shifts',
}

export default function ShiftsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Shift Management</h1>
        <AdvanceDay />
      </div>
      <ShiftManager />
    </div>
  )
}
