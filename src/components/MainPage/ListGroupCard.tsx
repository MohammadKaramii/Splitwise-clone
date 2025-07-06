import React, { useState, useCallback, useMemo, memo } from "react";
import { useDispatch } from "react-redux";
import { supabase } from "../../../supabase";
import toast from "react-hot-toast";
import { updateExpense } from "../../redux/slices/expensesSlice";
import { Loading } from "../Loading";
import { useAuth, useExpenses } from "../../hooks";

interface ExpenseItem {
  id: string;
  message: string;
  cost: number;
  whoPaid: string;
  sharedWith: string[];
  createdAt: string;
  groupId?: string;
}

interface ListState {
  data: ExpenseItem;
  members: string[];
  totalAmount?: number;
}

function ListGroupCardComponent({ data, members }: ListState) {
  const { user } = useAuth();
  const { deleteExpense } = useExpenses();
  const [listActive, setListActive] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [description, setDescription] = useState(data.message);
  const [cost, setCost] = useState(data.cost);
  const dispatch = useDispatch();
  const [updateMembers, setUpdateMembers] = useState(members);
  const [timeSpent, setTimeSpent] = useState(data.createdAt);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState("");

  const handleEdit = useCallback(() => {
    setEditMode((prevMode) => !prevMode);
  }, []);

  const handleMemberRemove = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, member: string) => {
      event.preventDefault();
      const updatedList = updateMembers.filter((m: string) => m !== member);
      if (updatedList.length === 0) {
        toast.error("At least one member must remain");
      } else {
        setUpdateMembers(updatedList);
        toast.success("Member removed successfully");
      }
    },
    [updateMembers]
  );

  const addClassName = useCallback(() => {
    setListActive((prevActive) => !prevActive);
  }, []);

  const handleTime = useCallback((time: string) => {
    const month = new Date(time)
      .toLocaleString("en-US", { month: "long" })
      .slice(0, 3);
    const day = new Date(time).getDate();
    const year = time?.slice(0, 4);
    return { month, day, year };
  }, []);

  const share = useMemo(
    () => cost / (members?.length || 1),
    [cost, members]
  ).toFixed(2);

  const handleSubmitEdit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsLoading(true);

      if (!user?.id) {
        toast.error("User not found");
        setIsLoading(false);
        return;
      }

      if (description === "" || description?.trim() === "") {
        toast.error("Description name can't be blank");
        setIsLoading(false);
        return;
      }

      if (cost <= 0) {
        toast.error("Cost can't be zero or negative");
        setIsLoading(false);
        return;
      }

      if (updateMembers.length === 0) {
        toast.error("At least one member must remain");
        setIsLoading(false);
        return;
      }

      const updatedExpense: ExpenseItem = {
        id: data.id,
        message: description,
        cost,
        whoPaid: data.whoPaid,
        sharedWith: updateMembers,
        groupId: data.groupId,
        createdAt: data.createdAt,
      };

      setTimeSpent(new Date().toISOString());

      try {
        const { error } = await supabase
          .from("expenses")
          .update({
            description: description,
            amount: cost,
            shared_with: updateMembers,
          })
          .eq("id", data.id);

        if (error) {
          toast.error("Update failed. Please try again.");
        } else {
          dispatch(updateExpense(updatedExpense));
          setDescription(updatedExpense.message);
          setCost(updatedExpense.cost);
          toast.success("Updated successfully");
          setEditMode(false);
        }
      } catch (error) {
        console.error("Update Expense error:", error);
        toast.error(`Update Expense error: ${error}`);
      } finally {
        setIsLoading(false);
      }
    },
    [
      description,
      cost,
      updateMembers,
      data.id,
      data.createdAt,
      data.whoPaid,
      data.groupId,
      dispatch,
      user?.id,
    ]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setIsLoading(true);

      try {
        const result = await deleteExpense(id);
        if (result?.success) {
          // Success message is handled by the deleteExpense function
        }
      } catch (error) {
        console.error("Delete Expense error:", error);
        toast.error(`Delete Expense error: ${error}`);
      } finally {
        setIsLoading(false);
      }
    },
    [deleteExpense]
  );

  const mem = useMemo(() => {
    // Filter out the current user's name from members
    const membersWithoutCurrentUser = members.filter(
      (member: string) => member !== user?.name
    );

    // Add "You" only if the current user is in the sharedWith array
    if (data.sharedWith.includes(user?.name || "")) {
      return [...membersWithoutCurrentUser, "You"];
    }

    return membersWithoutCurrentUser;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.whoPaid, data.sharedWith, members, user?.name]);

  const handleDeleteConfirmation = useCallback((id: string) => {
    setShowConfirmation(true);
    setDeleteItemId(id);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setShowConfirmation(false);
    setDeleteItemId("");
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    handleDelete(deleteItemId);
    setShowConfirmation(false);
    setDeleteItemId("");
  }, [handleDelete, deleteItemId]);

  if (!user) return null;

  return (
    <div className="list-box">
      {isLoading && <Loading />}
      {showConfirmation && (
        <div className="confirmation-dialog alert alert-danger mt-3 p-3">
          <p className="m-0">Are you sure you want to delete this expense?</p>
          <div className="mt-2">
            <button
              className="btn btn-secondary m-1"
              onClick={handleDeleteCancel}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger m-1"
              onClick={handleDeleteConfirm}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
      <div className="container">
        <div className="d-grid row">
          <div className="list-data-container col" onClick={addClassName}>
            <div className="row message-date col-6">
              <div className="col-1 mt-2 date">
                <p>{handleTime(timeSpent).month}</p>
                <p>{handleTime(timeSpent).day}</p>
              </div>
              <div className="col-4 msg-container">
                <img
                  src="https://s3.amazonaws.com/splitwise/uploads/category/icon/square_v2/uncategorized/general@2x.png"
                  className="icon"
                />
              </div>
              <span className="col-4 description">{description}</span>
            </div>

            <div className="spent-status col-5">
              <div className="aaaa col-5">
                <p>{data.whoPaid === user.name ? "You" : data.whoPaid} Paid</p>
                <strong>${cost}</strong>
              </div>
              <div
                className={`col-5 bbbb ${
                  data.whoPaid === user.name ? "lent-you" : "you-lent"
                }`}
              >
                <p>
                  {data.whoPaid === user.name
                    ? "You lent"
                    : `${data.whoPaid} lent you`}
                </p>
                <strong>
                  $
                  {data.whoPaid === user.name
                    ? data.sharedWith.includes(user.name)
                      ? (cost - cost / (data.sharedWith.length || 1)).toFixed(2)
                      : cost.toFixed(2)
                    : (cost / (data.sharedWith.length || 1)).toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="col-1 mt-2 delete-btn">
              <button
                onClick={() => {
                  handleDeleteConfirmation(data.id);
                }}
                className="btn border-0 mt-1 text-danger icon-button fa fa-trash"
              />
            </div>
          </div>
        </div>
      </div>
      <div className={!listActive ? "Show-list-info" : ""}>
        <div className="row Show-list-header statusOf-prices pt-3">
          <div className="col-3 ">
            <img
              className="icon-big"
              src="https://s3.amazonaws.com/splitwise/uploads/category/icon/square_v2/uncategorized/general@2x.png"
            />
          </div>
          <div className="col edit-menu">
            {editMode ? (
              <form onSubmit={handleSubmitEdit}>
                <div className="form-group">
                  <label>Description:</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Cost:</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={cost}
                    onChange={(event) => {
                      setCost(Number(event.target.value));
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Members:</label>
                  <ul className="list-group">
                    {updateMembers.map((member: string) => (
                      <li
                        key={member}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        {member}
                        <button
                          onClick={(event) => handleMemberRemove(event, member)}
                          className="btn btn-danger"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <button type="submit" className="btn save-btn m-2">
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-secondary m-2"
                  onClick={() => {
                    handleEdit();
                    setUpdateMembers(members);
                  }}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <h5>{description}</h5>
                <h4>
                  <strong> ${cost}</strong>
                </h4>
                <p>
                  Added by {user.name} on {handleTime(data.createdAt).month}{" "}
                  {handleTime(data.createdAt).day},{" "}
                  {handleTime(data.createdAt).year}
                </p>
                <p>
                  Last updated by {user.name} on {handleTime(timeSpent).month}{" "}
                  {handleTime(timeSpent).day}, {handleTime(timeSpent).year}
                </p>
                <div className="signup-btn top-btns list-btn edit-btn">
                  <button className="button" onClick={handleEdit}>
                    Edit expense
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="row owe-list">
          <div className="status-left col mr-2">
            <img src="https://s3.amazonaws.com/splitwise/uploads/user/default_avatars/avatar-ruby38-50px.png" />
            <strong>{data.whoPaid === user.name ? "You" : data.whoPaid}</strong>{" "}
            paid <strong>${cost}</strong>
            {mem
              .filter((member: string) => member !== data.whoPaid)
              .map((member: string, index: number) => {
                const avatarLink = `https://s3.amazonaws.com/splitwise/uploads/user/default_avatars/avatar-grey${
                  index + 1
                }-100px.png`;
                return (
                  <div className="mt-4" key={member}>
                    <span>
                      <img src={avatarLink} />
                    </span>
                    <span>
                      <strong> {member}</strong>{" "}
                      <span className="status-right px-1">owes</span>
                      <strong>${share}</strong>
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

export const ListGroupCard = memo(ListGroupCardComponent);
