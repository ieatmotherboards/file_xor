import React from 'react';
import logo from './logo.svg';
import './App.css';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from "./home/Home.js"
import Merges from "./merges/Merges.js"


function App() {
  const Router = HashRouter;
  return (
    <Router>
      <Routes>
        <Route path ="/" element ={<Home />} />
        <Route path = "/merges" element = {<Merges />} />
      </Routes>
    </Router>
  );
}

export default App;
