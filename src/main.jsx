import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// iOS Safari aktiverar inte :active på knappar utan detta trick
document.addEventListener('touchstart', function(){}, { passive: true });

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
