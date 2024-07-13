import { Link } from "react-router-dom";
import "./Header.css";
import { memo } from "react";

function HeaderComponent() {
  return (
    <header className="d-flex justify-content-between py-1 px-5 navbar-user align-items-center">
      <div className="logo">
        <img
          src="https://assets.splitwise.com/assets/core/logo-square-65a6124237868b1d2ce2f5db2ab0b7c777e2348b797626816400534116ae22d7.svg"
          className="image-logo my-2"
        />
        <Link to="/" className="name-company">
          <p>Splitwise </p>
        </Link>
      </div>
      <div className="d-flex">
        <Link to="/login">
          <button type="button" className="btn btn-light btn-primary-light mx-2 btn-letters">
            Log in
          </button>
        </Link>
        <Link to="/signup" className="home-signup-btn btn-letters">
          <button type="button" className="btn btn-success btn-primary-dark mx-2">
            Sign up
          </button>
        </Link>
      </div>
    </header>
  );
}

export const Header = memo(HeaderComponent);
