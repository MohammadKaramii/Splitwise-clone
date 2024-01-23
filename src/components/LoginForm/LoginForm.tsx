import { Link } from "react-router-dom";
import Header from "../Header";
import "./LoginForm.css";
import ReCAPTCHA from "react-google-recaptcha";
const LoginForm = () => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  return (
    <>
      <Header />
      <section className="home-row1 background w-100">
        <div className="container py-5 h-100">
          <div className="row d-flex justify-content-center align-items-center h-100">
            <div className="col-12 col-md-8 col-lg-6 col-xl-5">
              <div className="card shadow-2-strong signin ">
                <div className="card-body p-5 ">
                  <h3 className="mb-5 ">Log in</h3>

                  <div className="form-outline  mb-4">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      id="typeEmailX-2"
                      className="form-control form-control-lg login-form"
                    />
                  </div>

                  <div className="form-outline mb-4">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      id="typePasswordX-2"
                      className="form-control form-control-lg login-form"
                    />
                  </div>
                  <div className="mb-3">
                    <ReCAPTCHA sitekey={siteKey} />
                  </div>
                  <button className="btn  w-100 btn-block login" type="submit">
                    Log in
                  </button>
                  <Link className="forget" to="#">
                    <p className=" mt-4 pb-lg-2 ">Forgot your password?</p>
                  </Link>

                  <div className="or-text m-2">
                    <hr className="line" />
                    <div className="d-inline-block px-2">or</div>
                    <hr className="line" />
                  </div>

                  <button className="btn w-100 btn-block sumbit" type="submit">
                    <i className="fab fa-google me-2"></i> Sign in with Google
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default LoginForm;
