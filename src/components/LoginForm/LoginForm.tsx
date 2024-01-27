import { Link } from "react-router-dom";
import Header from "../Header/Header";
import "./LoginForm.css";
import ReCAPTCHA from "react-google-recaptcha";
import { supabase } from "../../../supabase";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { setSignInUserData } from "../../redux/reducers/userDataSlice";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { RootState } from "../../redux/store";
import SuccessLoginMessage from "../SuccessMessage";
import { toast } from "react-hot-toast";

const LoginForm = () => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const { session } = useSessionContext();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);
  const user = useSelector((state: RootState) => state.userData.user);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      console.error("Google login error:", error);
    } else if (session?.user) {
      const user = session.user;
      console.log("Google login success:", user);
      dispatch(setSignInUserData(user));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isRecaptchaVerified) {
      toast.error("Please verify that you are not a robot.", {
        duration: 4000,
      });
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Invalid credentials. Please try again!", {
          duration: 4000,
        });
      } else if (data) {
        dispatch(
          setSignInUserData({
            email: email,
            isSignIn: true,
          })
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again later!");
    }
  };

  const handleRecaptchaChange = (value: string | null) => {
    setIsRecaptchaVerified(!!value);
  };

  return (
    <>
      {user.isSignIn ? (
        <SuccessLoginMessage />
      ) : (
        <>
          <Header />
          <section className="home-row1 background w-100">
            <div className="container py-5 h-100">
              <div className="row d-flex justify-content-center align-items-center h-100">
                <div className="col-12 col-md-8 col-lg-6 col-xl-5">
                  <div className="card shadow-2-strong signin ">
                    <form onSubmit={handleSubmit}>
                      <div className="card-body p-5 ">
                        <h3 className="mb-5 ">Log in</h3>

                        <div className="form-outline  mb-4">
                          <label className="form-label">Email Address</label>
                          <input
                            type="email"
                            id="typeEmailX-2"
                            className="form-control form-control-lg "
                            onChange={(e) => setEmail(e.target.value)}
                            required={true}
                          />
                        </div>

                        <div className="form-outline mb-4">
                          <label className="form-label">Password</label>
                          <input
                            type="password"
                            id="typePasswordX-2"
                            className="form-control form-control-lg "
                            onChange={(e) => setPassword(e.target.value)}
                            required={true}
                          />
                        </div>
                        <div className="mb-3 ">
                          <ReCAPTCHA
                            sitekey={siteKey}
                            onChange={handleRecaptchaChange}
                          />
                        </div>
                        <button
                          className="btn  w-100 btn-block login"
                          type="submit"
                        >
                          Log in
                        </button>
                        <Link className="forget" to="/password_reset">
                          <p className=" mt-4 pb-lg-2 text-center ">
                            Forgot your password?
                          </p>
                        </Link>

                        <div className="or-text m-2">
                          <hr className="line" />
                          <div className="d-inline-block px-2">or</div>
                          <hr className="line" />
                        </div>

                        <button
                          className="btn w-100 btn-block sumbit"
                          type="submit"
                          onClick={handleGoogleLogin}
                        >
                          <i className="fab fa-google me-2"></i> Sign in with
                          Google
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
};

export default LoginForm;
