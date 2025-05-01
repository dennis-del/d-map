import { Route, Routes } from 'react-router-dom'
import './App.css'
import Map from './components/Map'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Map />} />
        <Route path="/dennis_map" element={<Map />} />
      </Routes>
    </div>
  )
}

export default App