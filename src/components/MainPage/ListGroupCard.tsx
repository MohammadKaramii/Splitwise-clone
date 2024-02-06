import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { supabase } from "../../../supabase";
import { updateMessage } from "../../redux/reducers/dummyDataSlice";
import { uid } from "uid";
import toast from "react-hot-toast";

interface ListState {
  data: {
    message: string;
    cost: number;
    createdAt: string;
    id: string;
    whoPaid: string;
    sharedWith: string[]
  };
  members: string[];
  totalAmount: number;
  paidStatus: { [key: string]: number | undefined }[];
}

const ListGroupCard = ({
  data,
  members,
  totalAmount,
  paidStatus,
}: ListState) => {
  const user = useSelector(
    (state: RootState) => state.userData.user
  );
 const activeGroupName = user.activeGroup


  const [listActive, setListActive] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [description, setDescription] = useState(data.message);
  const groups = useSelector((state: RootState) => state.dummyData.groups);
  const [cost, setCost] = useState(data.cost);
  const dispatch = useDispatch();
  const [updateMembers, setUpdateMembers] = useState(members);
  const [timeSpent, setTimeSpent] = useState(data.createdAt);

  const handleEdit = () => {
    setEditMode(!editMode);
  };

  const handleMemberRemove = (member: string) => {
    const updatedList = updateMembers.filter((m) => m !== member);
    setUpdateMembers(updatedList);
  };

  const addClassName = () => {
    setListActive(!listActive);
  };


  const handleTime = (time: string) => {
    const month = new Date(time)
      .toLocaleString("en-US", { month: "long" })
      .slice(0, 3);
    const day = new Date(time).getDate();
    const year = time.slice(0, 4);
    return { month, day, year };
  };

  const paidMembers = paidStatus?.reduce((acc: string[], member) => {
    const person = Object.entries(member);
    acc.push(String(person[0][0]));
    return acc;
  }, []);
  const share = (cost / (members.length + 1)).toFixed(2);

  const handleSubmitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (description === "" || description?.trim() === "") {
      toast.error("Description name can't be blank");
      return;
    }

    if (cost <= 0) {
      toast.error("cost can't be zero or negative");
      return;
    }

    
    const newHowSpent = {
      message: description,
      cost: cost,
      id: uid(),
      createdAt: new Date().toISOString(),
      whoPaid: data.whoPaid,
      sharedWith: data.sharedWith
    };
    setTimeSpent(newHowSpent.createdAt);
    
    const updatedGroups = groups.map((group) => {
      if (group.groupName === activeGroupName) {
        const updatedGroup = { ...group };
        const allExpenses = updatedGroup.howSpent?.filter(
          (howSpent) => howSpent.id !== data.id
        );

        updatedGroup.howSpent = [newHowSpent, ...allExpenses];
        updatedGroup.lastUpdate = newHowSpent.createdAt;
        return updatedGroup;
      }
      return group;
    });

    const indexCurrentGroup = updatedGroups.findIndex(
      (item) => item.groupName === activeGroupName
    );

    try {
      const { error } = await supabase
        .from("groups")
        .update({
          howSpent: updatedGroups[indexCurrentGroup].howSpent,
          lastUpdate: updatedGroups[indexCurrentGroup].lastUpdate,
        })
        .eq("groupName", activeGroupName);

      if (error) {
        toast.error("Update failed. Please try again.");
      } else {
        dispatch(updateMessage(updatedGroups));
        setDescription(newHowSpent.message);
        setCost(newHowSpent.cost);
        toast.success("Updated successfully");
        setEditMode(false);
      }
    } catch (error) {
      console.error("Update Expense error:", error);
      toast.error(`Update Expense error: ${error}`);

      return;
    }
  };


  const mem = data.whoPaid === user.name ? members : [...members, "You"]
  
  return (
    <div className="list-box">
      <div className="list-data-container" onClick={addClassName}>
        <div className="row message-date">
          <div className="col-2 mt-2 date">
            <p>{handleTime(timeSpent).month}</p>
            <p>{handleTime(timeSpent).day}</p>
          </div>
          <div className="col msg-container">
            <img src="https://s3.amazonaws.com/splitwise/uploads/category/icon/square_v2/uncategorized/general@2x.png" />
            <span> {description}</span>
          </div>
        </div>

        <div className="spent-status">
          <div>
            <p>{data.whoPaid === user.name ? 'You' : data.whoPaid} Paid</p>
            <strong>${cost}</strong>
          </div>
          <div className={data.whoPaid === user.name ? 'lent-you' : 'you-lent'}>
            <p>{data.whoPaid === user.name ? 'You lent' : `${data.whoPaid} lent you`} </p>
            <strong>${data.whoPaid === user.name ?(cost - cost / (members.length + 1)).toFixed(2) : (cost / (members.length + 1)).toFixed(2)}</strong>
          </div>
        </div>
      </div>
      <div className={!listActive ? "Show-list-info" : ""}>
        <div className="row Show-list-header statusOf-prices pt-3">
          <div className="col-3">
            <img src="https://s3.amazonaws.com/splitwise/uploads/category/icon/square_v2/uncategorized/general@2x.png" />
          </div>
          <div className="col">
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
                    {updateMembers.map((member) => (
                      <li
                        key={member}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        {member}
                        <button
                          onClick={() => handleMemberRemove(member)}
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
                  onClick={handleEdit}
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
                <div className="signup-btn top-btns list-btn">
                  <button className="button" onClick={handleEdit}>
                    Edit expense
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="row owe-list">
          <div className="status-left col ">
            <img src="https://s3.amazonaws.com/splitwise/uploads/user/default_avatars/avatar-ruby38-50px.png" />
            <strong>{data.whoPaid === user.name ? "You" : data.whoPaid}</strong> paid <strong>${cost}</strong>
            {
            mem.filter((member) => member !== data.whoPaid).map((member, index) => {
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
                    {paidMembers ? (
                      !paidMembers.includes(member) ? (
                        <strong>${share}</strong>
                      ) : (
                        <strong>$0.00</strong>
                      )
                    ) : (
                      <strong>${share}</strong>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <ul className="paid-list">
          {paidMembers && (
            <>
              <h5>Transactions</h5>
              {paidMembers.map((member) => {
                return (
                  <li className="paid-person-container" key={member}>
                    <i className="fa-regular fa-circle-check mx-1"></i>
                    <span>
                      <strong> {member}</strong>
                    </span>
                    <span className=""> paid his share of </span>
                    <strong>${share}</strong>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ListGroupCard;
