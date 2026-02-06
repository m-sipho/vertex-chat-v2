import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Register from './pages/Register'

function App() {

  return (
    <Routes>
      <Route path={""} element={<LoginPage />} />
      <Route path={"/dashboard"} element={<Dashboard />} />
      <Route path={"/register"} element={<Register />} />
    </Routes>
  )
}

export default App
