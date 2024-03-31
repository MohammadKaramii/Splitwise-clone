import { useState, useMemo, useCallback } from "react";
import validator from "validator";
import { useDispatch, useSelector } from "react-redux";
import { updateMessage } from "../../redux/reducers/dummyDataSlice";
import { RootState } from "../../redux/store";
import { supabase } from "../../../supabase";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { uid } from "uid";
interface Errors {
  description?: string;
  cost?: string;
  whoPaid?: string;
  sharedWith?: string;
}

interface FormData {
  description?: string;
  cost?: string;
  errors: Errors;
  isErrors: boolean;
}

interface HowSpent {
  createdAt: string;
  message?: string;
  cost?: number;
  id?: string;
  whoPaid?: string;
  sharedWith: string[];
}

const AddAnExpense = () => {
  const user = useSelector((state: RootState) => state.userData.user);
  const activeGroup = user.activeGroup;
  const groups = useSelector((state: RootState) => state.dummyData.groups);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    description: "",
    cost: "",
    errors: {},
    isErrors: false,
  });

  const { description, cost, errors, isErrors } = formData;
  const [isActive, setIsActive] = useState(false);
  const [whoPaid, setWhoPaid] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const handlePayerSelection = useCallback(
    (name: string) => {
      setWhoPaid(name);
      if (!selectedFriends.includes(name) && name !== user.name) {
        setSelectedFriends([name]);
      }
    },
    [selectedFriends, user.name]
  );

  const handleFriendSelection = useCallback(
    (friend: string) => {
      if (selectedFriends.includes(friend)) {
        setSelectedFriends(
          selectedFriends.filter((selectedFriend) => selectedFriend !== friend)
        );
      } else {
        setSelectedFriends([...selectedFriends, friend]);
      }
    },
    [selectedFriends]
  );

  const firendsInGroup = useMemo(
    () => groups.find((group) => group.groupName === activeGroup)?.friends,
    [groups, activeGroup]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [event.target.id]: event.target.value });
      setIsActive(true);
    },
    [formData]
  );
  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const formErrors: Errors = {};

      if (!description || !description.trim()) {
        formErrors.description = "Description name can't be blank";
      }
      if (!cost || !validator.isNumeric(cost)) {
        formErrors.cost = "Cost must be a number";
      }
      if (!whoPaid) {
        formErrors.whoPaid = "You must select a payer";
      }
      if (whoPaid !== user.name && !selectedFriends.includes(whoPaid)) {
        formErrors.sharedWith = "You must select the payer in shared friends";
      }
      if (selectedFriends.length === 0) {
        formErrors.sharedWith = "Please choose a friend for share expense";
      }

      if (Object.keys(formErrors).length > 0) {
        setFormData({ ...formData, errors: formErrors, isErrors: true });
        return;
      }

      const newEntry: HowSpent = {
        message: description,
        cost: Number(cost),
        id: uid(),
        createdAt: new Date().toISOString(),
        whoPaid: whoPaid,
        sharedWith: selectedFriends,
      };

      const updatedGroups = groups.map((group) => {
        if (group.groupName === activeGroup) {
          const updatedGroup = {
            ...group,
            howSpent: [newEntry, ...(group.howSpent || [])],
          };
          return updatedGroup;
        }
        return group;
      });

      const indexCurrentGroup = updatedGroups.findIndex(
        (item) => item.groupName === activeGroup
      );

      const { error } = await supabase
        .from("groups")
        .update({
          howSpent: updatedGroups[indexCurrentGroup].howSpent,
          lastUpdate: updatedGroups[indexCurrentGroup].lastUpdate,
        })
        .eq("groupName", activeGroup);

      if (error) {
        toast.error(`Error Adding data: ${error}`);
      } else {
        toast.success(`Data added successfully!`, {
          duration: 4000,
        });
        navigate("/mainpage");
      }

      dispatch(updateMessage(updatedGroups));

      setFormData({
        description: "",
        cost: "",
        errors: {},
        isErrors: false,
      });
    },
    [description, cost, whoPaid, user.name, selectedFriends, groups, activeGroup, dispatch, formData, navigate]
  );

  return (
    <>
      <div className="toppad"></div>
      <div className="container">
        <div className="d-flex justify-content-center gap-md-5">
          <div className="d-flex justify-content-center gap-md-5">
            <div className="col-md-2 signup-left-logo">
              <img
                src="https://assets.splitwise.com/assets/core/logo-square-65a6124237868b1d2ce2f5db2ab0b7c777e2348b797626816400534116ae22d7.svg"
                className="img-fluid"
                alt="Sample image"
              />
            </div>
            <div className="form-container">
              {isErrors && (
                <div className="error_messages">
                  <span className="error">The following errors occurred:</span>
                  <div id="errorExplanation">
                    <ul>
                      {errors.description && <li>{errors.description}</li>}
                      {errors.cost && <li>{errors.cost}</li>}
                      {errors.whoPaid && <li>{errors.whoPaid}</li>}
                      {errors.sharedWith && <li>{errors.sharedWith}</li>}
                    </ul>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-outline mb-3">
                  <label
                    className="form-label text-secondary"
                    htmlFor="description"
                  >
                    Enter a description
                  </label>
                  <input
                    type="text"
                    id="description"
                    className="form-control form-control-lg name-input"
                    value={description}
                    onChange={handleChange}
                  />
                </div>
                {isActive && (
                  <>
                    <div className="form-group mb-3 bottom-inputs">
                      <label className="form-label" htmlFor="cost">
                        <strong className="text-secondary">Enter Amount</strong>
                        :
                      </label>
                      <div className="price-input">
                        <input
                          type="text"
                          id="cost"
                          className="form-control name-input"
                          placeholder="$0.00"
                          value={cost}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="friend-selection">
                      <label>Choose who paid:</label>
                      <ul className="list-group">
                        {firendsInGroup?.map((friend) => (
                          <li
                            key={friend}
                            onClick={() => handlePayerSelection(friend)}
                            className={
                              whoPaid === friend
                                ? "list-group-item  my-1 active"
                                : "list-group-item  my-1"
                            }
                          >
                            {friend}
                          </li>
                        ))}
                        <li
                          key={user.name}
                          onClick={() => handlePayerSelection(user.name)}
                          className={
                            whoPaid === user.name
                              ? "list-group-item my-1 active"
                              : "list-group-item  my-1"
                          }
                        >
                          {user.name}
                        </li>
                      </ul>
                      {whoPaid && <p>You selected: {whoPaid}</p>}
                    </div>
                    <div className="friend-selection">
                      <label>Choose friends who will share the expense:</label>
                      <ul className="list-group">
                        {firendsInGroup?.map((friend) => (
                          <li
                            key={friend}
                            onClick={() => handleFriendSelection(friend)}
                            className={
                              selectedFriends.includes(friend)
                                ? "list-group-item  my-1 active"
                                : "list-group-item  my-1"
                            }
                          >
                            {friend}
                          </li>
                        ))}
                      </ul>
                      {selectedFriends.length > 0 && (
                        <p>Selected friends: {selectedFriends.join(", ")}</p>
                      )}
                    </div>
                    <div className="bottom-btns">
                      <div className="signup-btn Add-btn">
                        <button type="submit">Add</button>
                      </div>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddAnExpense;
