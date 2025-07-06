import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { supabase } from "../supabase";
import { setUser, clearUser } from "./redux/slices/authSlice";
import { useAuth } from "./hooks";
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
import { Loading } from "./components/Loading";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

export const App = () => {
  const dispatch = useDispatch();
  const { isLoading } = useAuth();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          dispatch(
            setUser({
              id: session.user.id,
              name: session.user.user_metadata.name || session.user.email || "",
              email: session.user.email || "",
              isSignedIn: true,
            })
          );
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        dispatch(
          setUser({
            id: session.user.id,
            name: session.user.user_metadata.name || session.user.email || "",
            email: session.user.email || "",
            isSignedIn: true,
          })
        );
      } else if (event === "SIGNED_OUT") {
        dispatch(clearUser());
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  if (isLoading) {
    return <Loading />;
  }

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
          element={
            <ProtectedRoute>
              <MainPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/new"
          element={
            <ProtectedRoute>
              <AddGroup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/addexpense"
          element={
            <ProtectedRoute>
              <AddAnExpense />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};
