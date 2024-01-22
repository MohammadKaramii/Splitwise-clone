import { useState } from "react";
import "./SignupForm.css";
import validator from "validator";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setSignInUserData } from "../../redux/reducers/userDataSlice";
import SuccessLoginMessage from "./SuccessMessage";
import { RootState } from "../../redux/store";
import { supabase } from "../../../supabase";
import { useSessionContext } from "@supabase/auth-helpers-react";


const SignupForm = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.userData.user);
  const { session } = useSessionContext();
  const [ifFilled, setIfFilled] = useState(false);
  const [isErrors, setIsErrors] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    password1: "",
  });
  const [isActive, setIsActive] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isActive) {
      if (name === "" || name.trim() === "") {
        errors.name = "First name can't be blank";
      }
  
      if (!validator.isEmail(email)) {
        errors.email = "Please enter a valid email address.";
      }
  
      if (password.length < 8) {
        errors.password = "Password is too short (minimum is 8 characters)";
      }
  
      if (!validator.isStrongPassword(password)) {
        errors.password1 =
          "Password is too common (e.g. '12345','password',etc) - please choose something more complex or unique";
      }
  
      if (Object.keys(errors).length === 0) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });
          if (error) {
            throw new Error("Sign up failed. Please try again.");
          } else if (data) {
            await supabase.auth.updateUser({
              data: { name: name },
            });
            dispatch(
              setSignInUserData({
                name: data.user?.name,
                email: data.user?.email,
                isSignIn: true,
              })
            );
          }
        } catch (error) {
          setIfFilled(true);
          console.error("Signup error:", error);
        }
      } else {
        setErrors(errors);
        setIsErrors(true);
        setIfFilled(true);
      }
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      setIfFilled(true);
      console.error("Google login error:", error);
    } else if (session?.user) {
      const user = session.user;
      console.log("Google login success:", user);
      dispatch(setSignInUserData(user));
    }
    console.log(user);
    
  };

  return (
    <>
      {user.isSignIn ? (
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
                        {errors.password1 && <li>{errors.password1}</li>}
                        {errors.email && <li>{errors.email}</li>}
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
                          Here’s my <strong>email address</strong>:
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
                          And here’s my <strong>password</strong>:
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
                    </>
                  )}

                  <div className="bottom-btns">
                    <div className="signup-btn">
                      <button type="submit">Sign me up!</button>
                    </div>
                    <div className="right-btn">
                      or
                      <button
                        className="btn btn-large btn-signup btn-google"
                        onClick={handleGoogleLogin}
                      >
                        <img
                          src="https://assets.splitwise.com/assets/fat_rabbit/signup/google-2017-a5b76a1c1eebd99689b571954b1ed40e13338b8a08d6649ffc5ca2ea1bfcb953.png"
                          alt="Google"
                        />
                        Sign up with Google
                      </button>
                    </div>
                  </div>

                  <div className="tos_acceptance">
                    <div>
                      <Link to="/signup">
                        By signing up, you accept the Splitwise Terms of
                        Service.
                      </Link>
                    </div>

                    {isActive && (
                      <div>
                        Don't use USD for currency?{" "}
                        <Link to="/signup">Click here</Link>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SignupForm;
