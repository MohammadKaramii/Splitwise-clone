import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { supabase } from "../../../supabase";
import toast from "react-hot-toast";
import { useState, useMemo, useCallback, useEffect } from "react";
import ListGroupCard from "./ListGroupCard";
import { setSpents } from "../../redux/reducers/spentsSlice";
const GroupActiveState = () => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState("");
  const groups = useSelector((state: RootState) => state.dummyData.groups);
  const paids = useSelector((state: RootState) => state.paids);
  const dispatch = useDispatch();
  const activeGroupName = useSelector(
    (state: RootState) => state.userData.user.activeGroup
  );
  const activeGroup = useMemo(
    () => groups.find((group) => group.groupName === activeGroupName),
    [groups, activeGroupName]
  );
  const spents = useSelector((state: RootState) => state.spents);

  
  const totalAmount = useMemo(
    () =>
      activeGroup
        ? activeGroup?.howSpent?.reduce((sum, item) => sum + item.cost, 0)
        : 0,
    [activeGroup]
  );

  useEffect(() => {
    if (!activeGroup || !activeGroup.howSpent) {
      return;
    }
  }, [activeGroup]);

  const handleDeleteConfirmation = useCallback((id: string) => {
    setShowConfirmation(true);
    setDeleteItemId(id);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setShowConfirmation(false);
    setDeleteItemId("");
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      const deleteSpent = (prevSpents) => {
        if (!prevSpents) {
          return [];
        } else {
          const spentIndexToDelete = prevSpents.findIndex(
            (spent) => spent.id === id
          );
          if (spentIndexToDelete !== -1) {
            return prevSpents.filter(
              (spent, index) => index !== spentIndexToDelete
            );
          } else {
            return prevSpents;
          }
        }
      };


      try {
        const { error } = await supabase
          .from("groups")
          .update({
            howSpent: deleteSpent(spents),
            lastUpdate: new Date().toISOString(),
          })
          .eq("groupName", activeGroupName);

        if (error) {
          toast.error("Delete failed. Please try again.");
        } else {

          dispatch(setSpents(deleteSpent(spents)));
          toast.success("Deleted successfully");
        }
      } catch (error) {
        console.error("Delete Expense error:", error);
        toast.error(`Delete Expense error: ${error}`);
      }
    },
    [activeGroupName, dispatch, spents]
  );

  const handleDeleteConfirm = useCallback(() => {
    handleDelete(deleteItemId);
    setShowConfirmation(false);
    setDeleteItemId("");
  }, [handleDelete, deleteItemId]);



  return (
    <div className="container">
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
      <ul className="list-group mt-2 mx-2">
        {spents?.map((data) => (
          <li key={data.id} className="list-group-item message-container">
            <ListGroupCard
              data={data}
              members={data.sharedWith}
              totalAmount={totalAmount}
            />

            <button
              onClick={() => {
                handleDeleteConfirmation(data.id);
              }}
              className="btn border-0 mt-1 text-danger icon-button fa fa-trash"
            />
          </li>
        ))}
      </ul>
      <ul className="paid-list">
          {paids ? (
            <>
              <h5>Transactions</h5>
              {paids.filter((paid)=> paid.groupName === activeGroupName).map((member) => {
                return paids ? (
                  <li className="paid-person-container" key={member.whoPaid}>
                    <i className="fa-regular fa-circle-check mx-1"></i>
                    <span>
                      <strong> {member.whoPaid}</strong>
                    </span>
                    <span className=""> paid his share of </span>
                    <strong>${member.howMuchPaid}</strong>
                    <span className=""> to {member.toWho} </span>
                  </li>
                ) : null;
              })}
            </>
          ) : null}
        </ul>
    </div>
  );
};

export default GroupActiveState;
