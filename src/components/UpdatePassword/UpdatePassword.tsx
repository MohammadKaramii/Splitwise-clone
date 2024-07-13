import { memo, useCallback, useState } from "react";
import { Header } from "../Header/Header";
import toast from "react-hot-toast";
import { supabase } from "../../../supabase";
import { useNavigate } from "react-router-dom";
import "./UpdatePassword.css";
function UpdatePasswordComponent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handlePasswordChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(event.target.value);
    },
    [setPassword]
  );

  const handleConfirmPasswordChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setConfirmPassword(event.target.value);
    },
    [setConfirmPassword]
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (password === confirmPassword) {
        try {
          await supabase.auth.updateUser({ password });
          toast.success("Password updated successfully!");
          setPassword("");
          setConfirmPassword("");
          navigate("/login");
        } catch (error) {
          console.error("Error updating password:", error);
          toast.error("An error occurred while updating the password");
        }
      } else {
        toast.error("Passwords do not match!");
      }
    },
    []
  );

  return (
    <>
      <Header />
      <div className="d-flex flex-column align-items-center my-5">
        <h2>Update Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group  update-form">
            <label>New Password:</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={handlePasswordChange}
              required={true}
            />
          </div>
          <div className="form-group update-form">
            <label>Confirm Password:</label>
            <input
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required={true}
            />
          </div>
          <button type="submit" className="btn btn-mint my-3">
            Update Password
          </button>
        </form>
      </div>
    </>
  );
}

export const UpdatePassword = memo(UpdatePasswordComponent);
