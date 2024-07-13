import { Link } from "react-router-dom";
import { Header } from "../Header/Header";
import "./LoginForm.css";
import ReCAPTCHA from "react-google-recaptcha";
import { supabase } from "../../../supabase";
import { setSignInUserData } from "../../redux/reducers/userDataSlice";
import { useDispatch, useSelector } from "react-redux";
import { memo, useCallback, useState } from "react";
import { RootState } from "../../redux/store";
import { SuccessLoginMessage } from "../SuccessMessage";
import { toast } from "react-hot-toast";
import { Loading } from "../Loading";
function LoginFormComponent() {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const user = useSelector((state: RootState) => state.userData.user);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!isRecaptchaVerified) {
        toast.error("Please verify that you are not a robot.", {
          duration: 4000,
        });
        return;
      }

      try {
        setIsLoading(true);

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
              name: data.user.user_metadata.name,
              email: email,
              isSignIn: true,
              id: data.user.id,
            })
          );
        }
      } catch (error) {
        console.error(error);
        toast.error("An error occurred. Please try again later!");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleRecaptchaChange = useCallback((value: string | null) => {
    setIsRecaptchaVerified(!!value);
  }, []);

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : user.isSignIn ? (
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
                        <div className="mb-3 recaptcha-login">
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
}

export const LoginForm = memo(LoginFormComponent);
