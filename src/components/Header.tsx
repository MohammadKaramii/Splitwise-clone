import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="d-flex justify-content-between p-1 px-5 navbar-user align-items-center">
    <div className="logo">
      <img
        src="https://assets.splitwise.com/assets/core/logo-square-65a6124237868b1d2ce2f5db2ab0b7c777e2348b797626816400534116ae22d7.svg"
        className="w-25"
      />
      <p>Splitwise </p>
    </div>
    <div className="d-flex">
    <Link to="/login">
      <button
        type="button"
        className="btn btn-light btn-primary-light mx-2"
      >
        Log in
      </button>
      </Link>
      <Link to="/signup" className="home-signup-btn">
        <button
          type="button"
          className="btn btn-success btn-primary-dark mx-2"
        >
          Sign up
        </button>
      </Link>
    </div>
  </header>
  )
}

export default Header