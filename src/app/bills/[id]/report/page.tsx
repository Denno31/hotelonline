'use client'

import React, { useEffect, useState } from 'react'
import { Container, CircularProgress, Alert } from '@mui/material'
import BillReport from '@/app/components/BillReport'

interface PageProps {
  params: {
    id: string
  }
}

export default function BillReportPage({ params }: PageProps) {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/bills/${params.id}/report`)
        if (!response.ok) {
          throw new Error('Failed to fetch report data')
        }
        const reportData = await response.json()
        setData(reportData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [params.id])

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Container>
    )
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (!data) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="info">No report data available</Alert>
      </Container>
    )
  }

  return (
    <Container sx={{ py: 4 }}>
      <BillReport data={data} />
    </Container>
  )
}
