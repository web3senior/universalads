import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import { AuthProvider } from './contexts/AuthContext'
import './index.scss'
import './styles/global.scss'

import Home from './routes/Home.jsx'
import Create from './routes/Create.jsx'
import Admin from './routes/Admin.jsx'
import Ad from './routes/Ad.jsx'
import Update from './routes/Update.jsx'

const root = document.getElementById('root')

createRoot(root).render(
  <BrowserRouter>
    <Routes>
      <Route
        index
        element={
          <AuthProvider>
            <Home />
          </AuthProvider>
        }
      />
      <Route path="create" element={<Create />} />
      <Route path="admin" element={<Admin />} />
      <Route path="ad" element={<Ad />} />
      <Route path="update" element={<AuthProvider><Update /></AuthProvider>} />
    </Routes>
  </BrowserRouter>
)
