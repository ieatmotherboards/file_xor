import React from 'react';
import logo from './logo.svg';
import './App.css';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from "./home/Home.js"
import MergePage from "./pages/MergePage";


function App() {
  const Router = HashRouter;
  return (
    <Router>
      <Routes>
        <Route path ="/" element ={<Home />} />

        {/* Merge page */}
        <Route path="/merge" element={<MergePage />} />
      </Routes>
    </Router>
  );
}

export default App;
