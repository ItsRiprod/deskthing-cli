import React from 'react'
import { createRoot } from 'react-dom/client'
import { DevWrapper } from './components/DevWrapper'
import DeveloperControls from './components/DeveloperControls'

const container = document.getElementById('root')
if (!container) throw new Error('Root element not found')

const root = createRoot(container)
root.render(
  <>
  <DeveloperControls />
  <DevWrapper />
  </>
)
