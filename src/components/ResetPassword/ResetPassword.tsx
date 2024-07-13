import { memo, useCallback, useState } from "react";
import "./ResetPassword.css";
import { toast } from "react-hot-toast";
import { Header } from "../Header/Header";
import ReCAPTCHA from "react-google-recaptcha";
import { supabase } from "../../../supabase";
import { Loading } from "../Loading";

function ResetPasswordFormComponent() {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const [email, setEmail] = useState("");
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsLoading(true);
      if (!isRecaptchaVerified) {
        toast.error("Please verify that you are not a robot.", {
          duration: 4000,
        });
        return;
      }

      if (!email) {
        toast.error("Please enter your email address", {
          duration: 4000,
        });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          "https://splitwise2024.vercel.app/password_reset/update_password",
      });
      if (error) {
        console.error(error);
        toast.error(`Something went wrong ${error.status}`, {
          duration: 4000,
        });
      } else {
        console.log("Reset password link sent to:", email);
        toast.success("Reset password link sent", {
          duration: 4000,
        });
      }
      setEmail("");
      setIsLoading(false);
    },
    []
  );

  const handleRecaptchaChange = useCallback(
    (value: string | null) => {
      setIsRecaptchaVerified(!!value);
    },
    [setIsRecaptchaVerified]
  );

  return (
    <>
      <Header />
      <div className="container">
        {isLoading && <Loading />}
        <div className=" row">
          <div className="col-md-2 offset-md-4">
            <img
              width="128"
              className="image my-4"
              src="https://assets.splitwise.com/assets/core/logo-square-65a6124237868b1d2ce2f5db2ab0b7c777e2348b797626816400534116ae22d7.svg"
              alt="Sample image"
            />
          </div>

          <div className="col-md-4">
            <h2 className="title-reset mx-md-3">Reset your password</h2>

            <p>
              Enter your email address or phone number and we’ll send you a link
              to reset your password.
            </p>

            <form className="form" onSubmit={handleSubmit}>
              <div className="tab-content">
                <div className="tab-pane active" id="auth-form-email">
                  <label htmlFor="email">Your email address</label>
                  <div className="input">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="off"
                      className="form-control mx-1"
                    />
                  </div>
                </div>

                <div className="py-3 recaptcha-reset">
                  <ReCAPTCHA
                    sitekey={siteKey}
                    onChange={handleRecaptchaChange}
                  />
                </div>

                <input
                  type="submit"
                  name="commit"
                  value="Reset password"
                  className="btn btn-mint btn-large"
                  data-disable-with="Reset password"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export const ResetPasswordForm = memo(ResetPasswordFormComponent);
