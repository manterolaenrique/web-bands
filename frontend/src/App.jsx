import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BandaPage from './components/BandaPage'
import BandasList from './components/BandasList'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/banda/:slug" element={<BandaPage />} />
        <Route path="/" element={<BandasList />} />
        <Route path="*" element={
          <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            fontSize: '1.2rem',
            color: '#666',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😞</div>
              <h1>Página no encontrada</h1>
              <p>La página que buscas no existe.</p>
              <button 
                onClick={() => window.history.back()}
                style={{
                  marginTop: '1rem',
                  padding: '0.8rem 1.5rem',
                  backgroundColor: '#3498db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Volver
              </button>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
