import { HashRouter as Router, Routes, Route } from "react-router-dom";
import MergePage from "./pages/MergePage";
import DiffPage from "./pages/DiffPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing / Diff page (THIS COULD AND SHOULD BE CHANGED WHEN A LANDING PAGE IS MADE*/} 
        <Route path="/" element={<DiffPage />} />

        {/* Merge page */}
        <Route path="/merge" element={<MergePage />} />
      </Routes>
    </Router>
  );
}

export default App;
