import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Document from "./components/Document";

const App: React.FC = () => {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:id" element={<Document />} />
      </Routes>
    </div>
  );
};

export default App;
