import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./components/HomePage/HomePage";
import "./App.css";
import SignupForm from "./components/SingupForm/SignupForm";
import LoginForm from "./components/LoginForm/LoginForm";
import ResetPassword from "./components/ResetPassword/ResetPassword";
import UpdatePassword from "./components/UpdatePassword/UpdatePassword";
import MainPage from "./components/MainPage/MainPage";
import AddGroup from "./components/MainPage/AddGroup";
import AddAnExpense from "./components/MainPage/AddAnExpense";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/password_reset" element={<ResetPassword />} />
          <Route
            path="/password_reset/update_password"
            element={<UpdatePassword />}
          />
          <Route path="/mainpage" element={<MainPage />} />
          <Route path="/groups/new" element={<AddGroup/>} />
          <Route path="/addexpense" element={<AddAnExpense/>} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
