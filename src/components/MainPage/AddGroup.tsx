import React, { useState, useCallback, memo } from "react";
import { useAuth, useGroups } from "../../hooks";
import { useNavigate } from "react-router-dom";
import { Loading } from "../Loading";
import { validateGroupName } from "../../utils/validation";

function AddGroupComponent() {
  const [isActive, setIsActive] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [validationError, setValidationError] = useState("");
  const { user } = useAuth();
  const { createGroup, isLoading } = useGroups();
  const navigate = useNavigate();
  const [members, setMembers] = useState([
    { name: user?.name || "", email: user?.email || "" },
    { name: "", email: "" },
    { name: "", email: "" },
    { name: "", email: "" },
  ]);

  const handleMemberChange = useCallback(
    (index: number, field: string, value: string) => {
      setMembers((prevMembers) => {
        const updatedMembers = [...prevMembers];
        if (field === "name") {
          updatedMembers[index].name = value;
        } else if (field === "email") {
          updatedMembers[index].email = value;
        }
        return updatedMembers;
      });
    },
    []
  );

  const handleRemoveMember = useCallback((index: number) => {
    setMembers((prevMembers) => {
      const updatedMembers = [...prevMembers];
      updatedMembers.splice(index, 1);
      return updatedMembers;
    });
  }, []);

  const handleAddMember = useCallback(() => {
    setMembers((prevMembers) => [...prevMembers, { name: "", email: "" }]);
  }, []);

  const handleGroupNameChange = useCallback(
    (value: string) => {
      setGroupName(value);
      setIsActive(true);

      // Clear previous validation error
      if (validationError) {
        setValidationError("");
      }

      // Validate group name
      const error = validateGroupName(value);
      if (error) {
        setValidationError(error);
      }
    },
    [validationError]
  );

  const saveGroup = useCallback(async () => {
    if (!user?.id) return;

    // Validate group name before saving
    const nameError = validateGroupName(groupName);
    if (nameError) {
      setValidationError(nameError);
      return;
    }

    // Filter out members with empty names and exclude the current user
    const groupMembers = members
      .filter((member) => member.name.trim() && member.name !== user.name)
      .map((member) => ({ name: member.name.trim(), email: member.email }));

    const result = await createGroup({
      name: groupName.trim(),
      members: groupMembers,
    });

    if (result?.success) {
      navigate("/mainpage");
    }
  }, [groupName, members, user?.id, user?.name, createGroup, navigate]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      saveGroup();
    },
    [saveGroup]
  );

  return (
    <>
      <div className="toppad"></div>
      <div className="container">
        {isLoading && <Loading />}
        <div className="d-flex justify-content-center gap-md-5">
          <div className="col-md-2 signup-left-logo">
            <img
              src="https://assets.splitwise.com/assets/core/logo-square-65a6124237868b1d2ce2f5db2ab0b7c777e2348b797626816400534116ae22d7.svg"
              className="img-fluid"
              alt="Sample image"
            />
          </div>
          <div className="form-container">
            <h6>START A NEW GROUP</h6>
            <form onSubmit={handleSubmit}>
              <div className="form-outline mb-3">
                <label className="form-label" htmlFor="name">
                  My group shall be called…
                </label>
                <input
                  type="text"
                  id="groupname"
                  className={`form-control form-control-lg name-input ${
                    validationError ? "is-invalid" : ""
                  }`}
                  required
                  value={groupName}
                  onChange={(event) =>
                    handleGroupNameChange(event.target.value)
                  }
                />
                {validationError && (
                  <div className="invalid-feedback d-block">
                    {validationError}
                  </div>
                )}
              </div>
              {isActive && (
                <>
                  <h6>Group members</h6>

                  {members.map((member, index) => (
                    <div key={index} className="mb-3">
                      <div className="row">
                        <div className="col-1">
                          <img
                            src="https://s3.amazonaws.com/splitwise/uploads/user/default_avatars/avatar-grey1-50px.png"
                            className={`${
                              !member.name ? "faded" : ""
                            } avatar rounded-circle`}
                            alt="Avatar"
                          />
                        </div>
                        <div className="col-5">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Name"
                            required
                            value={member.name}
                            onChange={(e) =>
                              handleMemberChange(index, "name", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-5">
                          <input
                            type="email"
                            className="form-control"
                            placeholder="Email address (optional)"
                            value={member.email}
                            onChange={(e) =>
                              handleMemberChange(index, "email", e.target.value)
                            }
                          />
                        </div>
                        {index !== 0 && (
                          <div className="col-1">
                            <button
                              className="btn border-0 mt-1  text-danger fa-solid fa-x"
                              onClick={() => handleRemoveMember(index)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    className="btn add-person-btn border-0  mb-3"
                    onClick={handleAddMember}
                  >
                    + Add a person
                  </button>
                </>
              )}

              <div className="bottom-btns">
                <div className="save-btn">
                  <button type="submit">Save</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export const AddGroup = memo(AddGroupComponent);
