import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

const ReCAPTCHAComponent = ReCAPTCHA as unknown as React.ComponentType<{
  sitekey: string;
  onChange: (value: string | null) => void;
}>;
import { useAuth } from "../../hooks";
import { Header } from "../Header/Header";
import { SuccessLoginMessage } from "../SuccessMessage";
import { Loading } from "../Loading";
import "./LoginForm.css";

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

interface FormData {
  email: string;
  password: string;
}

export const LoginForm = () => {
  const navigate = useNavigate();
  const { signIn, user, isLoading } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);

  const updateFormData = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!isRecaptchaVerified) {
        return;
      }

      const result = await signIn(formData);
      if (result?.success) {
        navigate("/mainpage");
      }
    },
    [formData, isRecaptchaVerified, signIn, navigate]
  );

  const handleRecaptchaChange = useCallback((value: string | null) => {
    setIsRecaptchaVerified(!!value);
  }, []);

  if (isLoading) return <Loading />;
  if (user?.isSignedIn) return <SuccessLoginMessage />;

  return (
    <>
      <Header />
      <section className="home-row1 background w-100">
        <div className="container py-5 h-100">
          <div className="row d-flex justify-content-center align-items-center h-100">
            <div className="col-12 col-md-8 col-lg-6 col-xl-5">
              <div className="card shadow-2-strong signin">
                <form onSubmit={handleSubmit}>
                  <div className="card-body p-5">
                    <h3 className="mb-5">Log in</h3>

                    <div className="form-outline mb-4">
                      <label className="form-label" htmlFor="email">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="form-control form-control-lg"
                        value={formData.email}
                        onChange={(e) =>
                          updateFormData("email", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="form-outline mb-4">
                      <label className="form-label" htmlFor="password">
                        Password
                      </label>
                      <input
                        type="password"
                        id="password"
                        className="form-control form-control-lg"
                        value={formData.password}
                        onChange={(e) =>
                          updateFormData("password", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="mb-3 recaptcha-login">
                      <ReCAPTCHAComponent
                        sitekey={siteKey}
                        onChange={handleRecaptchaChange}
                      />
                    </div>

                    <button
                      className="btn w-100 btn-block login"
                      type="submit"
                      disabled={!isRecaptchaVerified || isLoading}
                    >
                      {isLoading ? "Signing in..." : "Log in"}
                    </button>

                    <Link className="forget" to="/password_reset">
                      <p className="mt-4 pb-lg-2 text-center">
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
  );
};
