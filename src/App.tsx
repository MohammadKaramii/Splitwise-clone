import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { HomePage } from "./components/HomePage/HomePage";
import { NotFoundPage } from "./components/NotFound";
import "./App.css";
import { SignupForm } from "./components/SingupForm/SignupForm";
import { LoginForm } from "./components/LoginForm/LoginForm";
import { ResetPasswordForm } from "./components/ResetPassword/ResetPassword";
import { UpdatePassword } from "./components/UpdatePassword/UpdatePassword";
import { MainPage } from "./components/MainPage/MainPage";
import { AddGroup } from "./components/MainPage/AddGroup";
import { AddAnExpense } from "./components/MainPage/AddAnExpense";
import { useSelector } from "react-redux";
import { RootState } from "./redux/store";
import { memo } from "react";

function AppComponent() {
  const isLoggedIn = useSelector(
    (state: RootState) => state.userData.user.isSignIn
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/password_reset" element={<ResetPasswordForm />} />
        <Route
          path="/password_reset/update_password"
          element={<UpdatePassword />}
        />
        <Route
          path="/mainpage"
          element={isLoggedIn ? <MainPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/groups/new"
          element={isLoggedIn ? <AddGroup /> : <Navigate to="/login" />}
        />
        <Route
          path="/addexpense"
          element={isLoggedIn ? <AddAnExpense /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export const App = memo(AppComponent);
