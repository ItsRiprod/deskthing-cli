import React from 'react'
import { createRoot } from 'react-dom/client'
import { DevWrapper } from './DevWrapper'

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(<DevWrapper />)
