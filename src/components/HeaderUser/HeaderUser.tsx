import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import "./HeaderUser.css";
import { selectUserData } from "../../redux/reducers/userDataSlice";
import { memo, useCallback } from "react";
import { supabase } from "../../../supabase";
import toast from "react-hot-toast";

function HeaderUserComponent() {
  const userData = useSelector(selectUserData);
  const handleLogout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Error signing out");
        console.error("Logout error:", error);
      } else {
        // Redux state will be cleared automatically by the auth state listener in App.tsx
        toast.success("Logged out successfully");
      }
    } catch (error) {
      toast.error("Error signing out");
      console.error("Logout error:", error);
    }
  }, []);

  return (
    <nav className="navbar header">
      <div className="container header-content">
        <Link to="/mainpage">
          <img
            id="logo"
            src="https://assets.splitwise.com/assets/core/logo-wordmark-horizontal-white-short-c309b91b96261a8a993563bdadcf22a89f00ebb260f4f04fd814c2249a6e05d4.svg"
            alt="Logo"
          />
        </Link>
        <div className="header-right">
          <div className="dropdown">
            <button
              className="btn dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <img
                src="https://s3.amazonaws.com/splitwise/uploads/user/default_avatars/avatar-ruby38-50px.png"
                alt="User Avatar"
              />
              <span>{userData.name}</span>
            </button>
            <ul className="dropdown-menu">
              <li>
                <Link className="dropdown-item" to="/groups/new">
                  Create a group
                </Link>
              </li>

              <li>
                <Link className="dropdown-item" to="/" onClick={handleLogout}>
                  Log out
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}

export const HeaderUser = memo(HeaderUserComponent);
