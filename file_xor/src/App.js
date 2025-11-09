import React from 'react';
import logo from './logo.svg';
import './App.css';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from "./home/Home.js";
import Merges from "./merges/Merges.js";
import Landing from "./landing/Landing.js";
import Login from "./auth/Login.js"
import CreateAccount from "./auth/CreateAccount.js"


function App() {
  const Router = HashRouter;
  return (
    <Router>
      <Routes>
        <Route path ="/" element ={<Home />} />
        <Route path = "/merges" element = {<Merges />} />
        <Route path = "/landing" element = {<Landing />} />
        <Route path = "/login" element = {<Login />} />
        <Route path = "/create-account" element = {<CreateAccount />} />


      </Routes>
    </Router>
  );
}

export default App;
