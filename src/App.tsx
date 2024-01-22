import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./components/HomePage/HomePage";
import "./App.css";
import SignupForm from "./components/SingupForm/SignupForm";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignupForm />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
