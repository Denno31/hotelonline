'use client'

import React from 'react'
import { Button } from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import { useRouter } from 'next/navigation'

interface PrintBillButtonProps {
  billId: string
}

const PrintBillButton: React.FC<PrintBillButtonProps> = ({ billId }) => {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/bills/${billId}/report`)
  }

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<PrintIcon />}
      onClick={handleClick}
      size="small"
    >
      Print Bill
    </Button>
  )
}

export default PrintBillButton
