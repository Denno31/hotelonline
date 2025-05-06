'use client'

import React, { useEffect, useState } from 'react'
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material'
import PrintBillButton from '@/app/components/PrintBillButton'

interface PageProps {
  params: {
    id: string
  }
}

export default function BillDetailsPage({ params }: PageProps) {
  const [bill, setBill] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const response = await fetch(`/api/bills/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch bill data')
        }
        const billData = await response.json()
        setBill(billData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchBill()
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

  if (!bill) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="info">No bill data available</Alert>
      </Container>
    )
  }

  return (
    <Container sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Bill Details</Typography>
          <PrintBillButton billId={params.id} />
        </Stack>

        <Grid container spacing={3}>
          {/* Add your bill details content here */}
          <Grid item xs={12}>
            <Box>
              <Typography variant="body1">
                Bill #{bill.id}
              </Typography>
              {/* Add more bill details as needed */}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  )
}
