import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <header>
                    <h1>Medicine Marketplace Platform</h1>
                </header>
                <main>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/medicines" element={<Medicines />} />
                        <Route path="/cart" element={<Cart />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

function Home() {
    return <h2>Welcome to Medicine Marketplace</h2>;
}

function Medicines() {
    return <h2>Available Medicines</h2>;
}

function Cart() {
    return <h2>Shopping Cart</h2>;
}

export default App;