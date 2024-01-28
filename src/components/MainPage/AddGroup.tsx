import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setGroupData } from "../../redux/reducers/dummyDataSlice";
import { selectUserData } from "../../redux/reducers/userDataSlice";
import { RootState } from "../../redux/store";
import { uid } from "uid";
import { supabase } from "../../../supabase";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AddGroup = () => {
  const [isActive, setIsActive] = useState(false);
  const [groupName, setGroupName] = useState("");
  const userData = useSelector(selectUserData);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [members, setMembers] = useState([
    { id: userData.id, name: userData.name, email: userData.email },
    { id: "", name: "", email: "" },
    { id: "", name: "", email: "" },
    { id: "", name: "", email: "" },
  ]);
  const currentGroups = useSelector((state: RootState) =>
    state.dummyData.groups.filter((group) => group.userId === userData.id)
  );


console.log(currentGroups);

  const handleMemberChange = (index: number, field: string, value: string) => {
    const updatedMembers = [...members];
    if (field === "name") {
      updatedMembers[index].name = value;
    } else if (field === "email") {
      updatedMembers[index].email = value;
    }
    setMembers(updatedMembers);
  };

  const handleRemoveMember = (index: number) => {
    const updatedMembers = [...members];
    updatedMembers.splice(index, 1);
    setMembers(updatedMembers);
  };

  const handleAddMember = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const updatedMembers = [
      ...members,
      {
        id: userData.id,
        name: userData.name,
        email: userData.email,
      },
    ];
    setMembers(updatedMembers);
  };

  const saveGroup = async () => {
    const newGroup = {
      id: uid(),
      groupName: groupName,
      friends: members
        .filter((member) => member.id !== userData.id)
        .map((member) => member.name),
      userId: userData.id,
    };


    const { data, error } = await supabase.from("groups").insert([newGroup]);

    if (error) {
      toast.error(`Error saving group: ${error}`);
      return;
    } else {
      toast.success("Group saved successfully", {
        duration: 4000,
      });
      dispatch(setGroupData([...currentGroups, newGroup]));
      navigate("/mainpage");
    }
  };
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveGroup();
  };
  return (
    <>
      <div className="toppad"></div>
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
            <h6>START A NEW GROUP</h6>
            <form onSubmit={handleSubmit}>
              <div className="form-outline mb-3">
                <label className="form-label" htmlFor="name">
                  My group shall be called…
                </label>
                <input
                  type="text"
                  id="groupname"
                  className="form-control form-control-lg name-input"
                  required
                  value={groupName}
                  onChange={(event) => {
                    setGroupName(event.target.value);
                    setIsActive(true);
                  }}
                />
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
                            ></button>
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
};

export default AddGroup;
