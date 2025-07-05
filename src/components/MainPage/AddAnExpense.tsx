import { useState, useMemo, useCallback, memo } from "react";
import validator from "validator";
import { useDispatch, useSelector } from "react-redux";
import { updateGroup } from "../../redux/reducers/groupSlice";
import { RootState } from "../../redux/store";
import { supabase } from "../../../supabase";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { uid } from "uid";
import { Loading } from "../Loading";
import { setSpents } from "../../redux/reducers/spentsSlice";
import { FormData, HowSpent, Errors } from "../../types";

function AddAnExpenseComponent() {
  const user = useSelector((state: RootState) => state.userData.user);
  const activeGroup = user.activeGroup;
  const groups = useSelector((state: RootState) => state.groups.groups);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const spents = useSelector((state: RootState) => state.spents);
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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroupForExpense, setSelectedGroupForExpense] = useState("");

  const handlePayerSelection = useCallback((name: string) => {
    setWhoPaid(name);
    // Don't automatically add payer to shared expense list
    // Users can manually select who shares the expense
  }, []);

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

  const activeFriend = user.activeFriend;

  // Get groups that contain the active friend, or all groups if no friend is selected
  const availableGroups = useMemo(() => {
    if (activeFriend) {
      return groups.filter((group) => group.friends.includes(activeFriend));
    }
    return groups;
  }, [groups, activeFriend]);

  const firendsInGroup = useMemo((): string[] => {
    // Use activeGroup if available, otherwise use selectedGroupForExpense
    const groupName = activeGroup || selectedGroupForExpense;
    const currentGroup = groups.find((group) => group.groupName === groupName);

    if (!currentGroup) {
      return [];
    }

    // Create a complete list of all group members including the current user
    const allMembers: string[] = [...(currentGroup.friends || [])];

    // Add current user if not already in the friends list
    if (!allMembers.includes(user.name)) {
      allMembers.push(user.name);
    }

    return allMembers;
  }, [groups, activeGroup, selectedGroupForExpense, user.name]);

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
      setIsLoading(true);

      const formErrors: Errors = {};

      if (!description || !description.trim()) {
        formErrors.description = "Description name can't be blank";
      }
      if (!cost || !validator.isNumeric(cost)) {
        formErrors.cost = "Cost must be a number";
      }
      if (!activeGroup && !selectedGroupForExpense) {
        formErrors.whoPaid = "You must select a group for this expense";
      }
      if (!whoPaid) {
        formErrors.whoPaid = "You must select a payer";
      }
      if (selectedFriends.length === 0) {
        formErrors.sharedWith = "Please choose a friend for share expense";
      }
      if (selectedFriends.length === 1 && selectedFriends.includes(whoPaid)) {
        formErrors.sharedWith =
          "You cannot share an expense only with the payer. Please select at least one other person to share the expense with.";
      }

      if (Object.keys(formErrors).length > 0) {
        setFormData({ ...formData, errors: formErrors, isErrors: true });
        setIsLoading(false);
        return;
      }

      try {
        const newEntry: HowSpent = {
          message: description,
          cost: Number(cost),
          id: uid(),
          createdAt: new Date().toISOString(),
          whoPaid: whoPaid,
          sharedWith: selectedFriends,
        };

        dispatch(setSpents([newEntry, ...spents]));

        const targetGroupName = activeGroup || selectedGroupForExpense;

        const updatedGroups = groups.map((group) => {
          if (group.groupName === targetGroupName) {
            const updatedGroup = {
              ...group,
              howSpent: [newEntry, ...(spents || [])],
            };
            return updatedGroup;
          }
          return group;
        });
        dispatch(updateGroup(updatedGroups));

        const { error } = await supabase
          .from("groups")
          .update({
            howSpent: [newEntry, ...spents],
            lastUpdate: newEntry.createdAt,
          })
          .eq("groupName", targetGroupName)
          .eq("userId", user.id);

        if (error) {
          toast.error(`Error Adding data: ${error}`);
        } else {
          toast.success(`Data added successfully!`, {
            duration: 4000,
          });
          navigate("/mainpage");
        }

        setFormData({
          description: "",
          cost: "",
          errors: {},
          isErrors: false,
        });
        setSelectedGroupForExpense("");
        setWhoPaid("");
        setSelectedFriends([]);
      } catch (error) {
        toast.error(`Unexpected error: ${error}`);
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      description,
      cost,
      whoPaid,
      user.name,
      user.id,
      selectedFriends,
      dispatch,
      spents,
      groups,
      activeGroup,
      selectedGroupForExpense,
      formData,
      navigate,
    ]
  );

  return (
    <>
      <div className="toppad"></div>
      {isLoading && <Loading />}
      <div className="container py-5">
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
                {!activeGroup && (
                  <div className="form-outline mb-3">
                    <label className="form-label text-secondary">
                      Choose a group for this expense
                    </label>
                    <select
                      className="form-control form-control-lg"
                      value={selectedGroupForExpense}
                      onChange={(e) =>
                        setSelectedGroupForExpense(e.target.value)
                      }
                    >
                      <option value="">Select a group...</option>
                      {availableGroups.map((group) => (
                        <option key={group.id} value={group.groupName}>
                          {group.groupName}
                        </option>
                      ))}
                    </select>
                    {availableGroups.length === 0 && (
                      <div className="mt-2">
                        <p className="text-muted">No groups available. </p>
                        <Link
                          to="/groups/new"
                          className="btn btn-primary btn-sm"
                        >
                          Create a new group
                        </Link>
                      </div>
                    )}
                  </div>
                )}

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
                        {firendsInGroup?.map((member) => (
                          <li
                            key={member}
                            onClick={() => handlePayerSelection(member)}
                            className={
                              whoPaid === member
                                ? "list-group-item  my-1 active"
                                : "list-group-item  my-1"
                            }
                          >
                            {member} {member === user.name && "(You)"}
                          </li>
                        ))}
                      </ul>
                      {whoPaid && <p>You selected: {whoPaid}</p>}
                    </div>
                    <div className="friend-selection">
                      <label>Choose who will share the expense:</label>
                      <ul className="list-group">
                        {firendsInGroup?.map((member) => (
                          <li
                            key={member}
                            onClick={() => handleFriendSelection(member)}
                            className={
                              selectedFriends.includes(member)
                                ? "list-group-item  my-1 active"
                                : "list-group-item  my-1"
                            }
                          >
                            {member} {member === user.name && "(You)"}
                          </li>
                        ))}
                      </ul>
                      {selectedFriends.length > 0 && (
                        <p>Selected members: {selectedFriends.join(", ")}</p>
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
}

export const AddAnExpense = memo(AddAnExpenseComponent);
