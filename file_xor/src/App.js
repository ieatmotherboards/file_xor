import React from 'react';
import logo from './logo.svg';
import './App.css';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from "./home/Home.js";
import Merges from "./merges/Merges.js";
import Landing from "./landing/Landing.js";
import Login from "./auth/Login.js"
import CreateAccount from "./auth/CreateAccount.js"
import MergeHistory from './merges/Merges.js';
import ProtectedRoute from './auth/ProtectedRoute.js';

function App() {
  const Router = HashRouter;
  return (
    <Router>
      <Routes>
        <Route path = "/create-account" element = {<CreateAccount />} />
        <Route path = "/landing" element = {<Landing />} />
        <Route path = "/login" element = {<Login />} />

         <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />

        <Route path="/merges" element={
          <ProtectedRoute>
            <MergeHistory />
          </ProtectedRoute>
        } />


      </Routes>
    </Router>
  );
}

export default App;
