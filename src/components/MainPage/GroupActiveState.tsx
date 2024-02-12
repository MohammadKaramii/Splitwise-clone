import { useDispatch, useSelector } from "react-redux";
import ListGroupCard from "./ListGroupCard";
import { RootState } from "../../redux/store";
import { supabase } from "../../../supabase";
import toast from "react-hot-toast";
import { updateMessage } from "../../redux/reducers/dummyDataSlice";
import { useState } from "react";
const GroupActiveState = () => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState("");
  const groups = useSelector((state: RootState) => state.dummyData.groups);
  const activeGroup = useSelector(
    (state: RootState) => state.userData.user.activeGroup
  );
  const activeGroupData = groups.find(
    (group) => group.groupName === activeGroup
  );
  const dispatch = useDispatch();
  if (!activeGroupData || !activeGroupData.howSpent) return null;

  const totalAmount = activeGroupData.howSpent.reduce(
    (sum, item) => sum + item.cost,
    0
  );

  const handleDeleteConfirmation = (id: string) => {
    setShowConfirmation(true);
    setDeleteItemId(id);
  };

  const handleDeleteCancel = () => {
    setShowConfirmation(false);
    setDeleteItemId("");
  };

  const handleDelete = async (id: string) => {
    const updatedGroups = groups.map((group) => {
      if (group.groupName === activeGroup) {
        const updatedGroup = { ...group };
        updatedGroup.howSpent = updatedGroup.howSpent.filter(
          (expense) => expense.id !== id
        );
        updatedGroup.lastUpdate = new Date().toISOString();
        return updatedGroup;
      }
      return group;
    });

    const indexCurrentGroup = updatedGroups.findIndex(
      (group) => group.groupName === activeGroup
    );

    try {
      const { error } = await supabase
        .from("groups")
        .update({
          howSpent: updatedGroups[indexCurrentGroup].howSpent,
          lastUpdate: updatedGroups[indexCurrentGroup].lastUpdate,
        })
        .eq("groupName", activeGroup);

      if (error) {
        toast.error("Delete failed. Please try again.");
      } else {
        dispatch(updateMessage(updatedGroups));
        toast.success("Deleted successfully");
      }
    } catch (error) {
      console.error("Delete Expense error:", error);
      toast.error(`Delete Expense error: ${error}`);
    }
  };

  const handleDeleteConfirm = async () => {
    await handleDelete(deleteItemId);
    setShowConfirmation(false);
    setDeleteItemId("");
  };

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
        {activeGroupData.howSpent.map((data) => (
          <li key={data.id} className="list-group-item message-container">
            <ListGroupCard
              data={data}
              members={data.sharedWith}
              totalAmount={totalAmount}
              paidStatus={activeGroupData.paid}
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
    </div>
  );
};

export default GroupActiveState;
