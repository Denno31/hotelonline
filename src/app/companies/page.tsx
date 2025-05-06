'use client'

import { useEffect, useState } from 'react'
import { Company } from '@prisma/client'
import CompanyForm from '@/components/CompanyForm'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      const data = await response.json()
      if (data.success) {
        setCompanies(data.data)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const handleCompanyCreated = (company: Company) => {
    setCompanies([...companies, company])
    setShowForm(false)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Companies</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Company
        </button>
      </div>

      {showForm && (
        <CompanyForm
          onClose={() => setShowForm(false)}
          onSuccess={handleCompanyCreated}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div key={company.id} className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">{company.name}</h2>
            <div className="space-y-2">
              {company.email && (
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {company.email}
                </p>
              )}
              {company.phone && (
                <p className="text-sm">
                  <span className="font-medium">Phone:</span> {company.phone}
                </p>
              )}
              {company.address && (
                <p className="text-sm">
                  <span className="font-medium">Address:</span> {company.address}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
