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
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./redux/store";
import { memo, useEffect, useState } from "react";
import { supabase } from "../supabase";
import { setSignInUserData, signOutUser } from "./redux/reducers/userDataSlice";
import { Loading } from "./components/Loading";

function AppComponent() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(
    (state: RootState) => state.userData.user.isSignIn
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session and set up auth state listener
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
        } else if (session) {
          // User has valid session, restore user data
          dispatch(
            setSignInUserData({
              name: session.user.user_metadata.name || session.user.email,
              email: session.user.email,
              isSignIn: true,
              id: session.user.id,
            })
          );
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        dispatch(
          setSignInUserData({
            name: session.user.user_metadata.name || session.user.email,
            email: session.user.email,
            isSignIn: true,
            id: session.user.id,
          })
        );
      } else if (event === "SIGNED_OUT") {
        dispatch(signOutUser());
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  // Show loading spinner while checking session
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
