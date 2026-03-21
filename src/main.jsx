import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import FocusIQ from './FocusIQ.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FocusIQ />
  </StrictMode>,
)
