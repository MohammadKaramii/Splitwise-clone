import { memo, useCallback, useState } from "react";
import "./SignupForm.css";
import validator from "validator";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/slices/authSlice";
import { SuccessLoginMessage } from "../SuccessMessage";
import { supabase } from "../../../supabase";
import ReCAPTCHA from "react-google-recaptcha";
import { Loading } from "../Loading";
import { useAuth } from "../../hooks";

interface ErrorsSignup {
  name?: string;
  email?: string;
  password?: string;
  recaptcha?: string;
}

function SignupFormComponent() {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [ifFilled, setIfFilled] = useState(false);
  const [isErrors, setIsErrors] = useState(false);
  const [errors, setErrors] = useState<ErrorsSignup>({});
  const [isActive, setIsActive] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isActive) {
        const newErrors: ErrorsSignup = {};

        if (name === "" || name.trim() === "") {
          newErrors.name = "First name can't be blank";
        }

        if (!validator.isEmail(email)) {
          newErrors.email = "Please enter a valid email address.";
        }

        if (password.length < 8) {
          newErrors.password =
            "Password is too short (minimum is 8 characters)";
        }

        if (!isRecaptchaVerified) {
          newErrors.recaptcha = "Please verify that you are not a robot.";
        }

        if (Object.keys(newErrors).length === 0) {
          try {
            setIsLoading(true);
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  name: name,
                },
              },
            });

            if (error) {
              throw new Error("Sign up failed. Please try again.");
            } else if (data) {
              dispatch(
                setUser({
                  id: data.user?.id || "",
                  name: data.user?.user_metadata.name,
                  email: email,
                  isSignedIn: true,
                })
              );
            }
          } catch (error) {
            console.error("Signup error:", error);
            setIsErrors(true);
            setIfFilled(true);
            return;
          } finally {
            setIsLoading(false);
          }
        }

        setErrors(newErrors);
        setIsErrors(Object.keys(newErrors).length > 0);
        setIfFilled(Object.keys(newErrors).length > 0);
      }
    },
    [name, email, password, isActive, isRecaptchaVerified, dispatch]
  );

  const handleRecaptchaChange = useCallback(
    (value: string | null) => {
      setIsRecaptchaVerified(!!value);
    },
    [setIsRecaptchaVerified]
  );

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : user?.isSignedIn ? (
        <SuccessLoginMessage />
      ) : (
        <>
          {ifFilled ? (
            <div className="toppad">
              <h6 className="alert-message">
                Verification failed, please try again.
                <button
                  className="close"
                  onClick={() => {
                    setIfFilled(false);
                  }}
                >
                  &times;
                </button>
              </h6>
            </div>
          ) : (
            <div className="toppad"></div>
          )}

          <div className="container">
            <div className="d-flex justify-content-center gap-md-5">
              <div className="col-md-2 signup-left-logo">
                <img
                  src="https://assets.splitwise.com/assets/core/logo-square-65a6124237868b1d2ce2f5db2ab0b7c777e2348b797626816400534116ae22d7.svg"
                  className="img-fluid"
                  alt="Sample image"
                />
              </div>
              <div className="form-container">
                <h6>INTRODUCE YOURSELF</h6>

                {isErrors && (
                  <div className="error_messages">
                    <span className="error">
                      The following errors occurred:
                    </span>
                    <div id="errorExplanation">
                      <ul>
                        {errors.name && <li>{errors.name}</li>}
                        {errors.password && <li>{errors.password}</li>}
                        {errors.email && <li>{errors.email}</li>}
                        {errors.recaptcha && <li>{errors.recaptcha}</li>}
                      </ul>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-outline mb-3">
                    <label className="form-label" htmlFor="name">
                      Hi there! My name is
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="form-control form-control-lg name-input"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);

                        setIsActive(true);
                      }}
                    />
                  </div>
                  {isActive && (
                    <>
                      <div className="form-group mb-3 bottom-inputs">
                        <label className="form-label" htmlFor="email">
                          Here's my <strong>email address</strong>:
                        </label>
                        <input
                          type="text"
                          id="email"
                          className="form-control name-input"
                          value={email}
                          onChange={(event) => {
                            setEmail(event.target.value);
                          }}
                        />
                      </div>
                      <div className="form-group mb-3 bottom-inputs">
                        <label className="form-label" htmlFor="password">
                          And here's my <strong>password</strong>:
                        </label>
                        <input
                          type="password"
                          id="password"
                          className="form-control name-input"
                          value={password}
                          onChange={(event) => {
                            setPassword(event.target.value);
                          }}
                        />
                      </div>
                      <div className="mb-3 recaptcha-signin">
                        {(() => {
                          const ReCAPTCHAComponent =
                            ReCAPTCHA as unknown as React.ComponentType<{
                              sitekey: string;
                              onChange: (value: string | null) => void;
                            }>;
                          return (
                            <ReCAPTCHAComponent
                              sitekey={siteKey}
                              onChange={handleRecaptchaChange}
                            />
                          );
                        })()}
                      </div>
                    </>
                  )}

                  <div className="bottom-btns">
                    <div className="signup-btn">
                      <button type="submit">Sign me up!</button>
                    </div>
                  </div>

                  <div className="tos_acceptance">
                    <div>
                      <Link to="/signup">
                        By signing up, you accept the Splitwise Terms of
                        Service.
                      </Link>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export const SignupForm = memo(SignupFormComponent);
