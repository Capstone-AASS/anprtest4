// src/App.js
import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainSection from './components/MainSection';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <Sidebar setActiveSection={setActiveSection} />
        <MainSection activeSection={activeSection} />
      </div>
      <Footer />
    </div>
  );
}

export default App;
