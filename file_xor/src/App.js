import { HashRouter as Router, Routes, Route } from "react-router-dom";
import MergePage from "./pages/MergePage";
//import DiffPage from "./pages/DiffPage"; // (or whatever your diff screen is called)

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing / Diff page */}
        <Route path="/" element={<MergePage />} />

        {/* Merge page */}
        <Route path="/merge" element={<MergePage />} />
      </Routes>
    </Router>
  );
}

export default App;
