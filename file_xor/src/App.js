import React from 'react';
import logo from './logo.svg';
import './App.css';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from "./home/Home.js"


function App() {
  const Router = HashRouter;
  return (
    <Router>
      <Routes>
        <Route path ="/" element ={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
