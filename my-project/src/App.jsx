import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import Header from './Components/Header.jsx'
import Footer from './Components/Footer.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Sign-up.jsx'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white text-gray-900 selection:bg-orange-100 selection:text-orange-900">
        <div className="relative flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow pt-20">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </Router>
  )
}

export default App