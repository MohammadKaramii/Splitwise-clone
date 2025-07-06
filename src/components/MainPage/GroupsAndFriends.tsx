import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { supabase } from "../../../supabase";
import { setGroups } from "../../redux/slices/groupsSlice";
import { setExpenses } from "../../redux/slices/expensesSlice";
import { setPayments } from "../../redux/slices/paymentsSlice";
import { setActiveGroup, setActiveFriend } from "../../redux/slices/authSlice";
import toast from "react-hot-toast";
import { useAuth, useGroups, useExpenses } from "../../hooks";

function GroupsAndFriendsComponent() {
  const { user } = useAuth();
  const { groups } = useGroups();
  const { fetchExpenses } = useExpenses();
  const dispatch = useDispatch();
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedFriend, setSelectedFriend] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const fetchGroupsData = useCallback(async () => {
    if (!user?.id) return;

    const { data: groupsData, error: groupsError } = await supabase
      .from("groups")
      .select("*")
      .eq("userId", user.id);

    if (groupsError) {
      throw new Error(groupsError.message);
    }

    dispatch(setGroups(groupsData || []));
  }, [dispatch, user?.id]);

  const fetchPaidsData = useCallback(async () => {
    if (!user?.id) return;

    const paidsResponse = await supabase
      .from("myPaids")
      .select("*")
      .eq("userId", user.id);
    const { data: paids, error: paidsError } = paidsResponse;

    if (paidsError) {
      throw new Error(paidsError.message);
    }

    dispatch(setPayments(paids[0]?.paids || []));
  }, [dispatch, user?.id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchGroupsData();
        await fetchPaidsData();
        await fetchExpenses();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [dispatch, fetchGroupsData, fetchPaidsData, fetchExpenses, user?.id]);

  const uniqueFriends = useMemo(() => {
    const friends = groups.map((group) => group.friends);
    return Array.from(new Set(friends.flat()));
  }, [groups]);

  const handleClickOnGroup = useCallback(
    (groupName: string) => {
      dispatch(setActiveGroup(groupName));
      dispatch(setActiveFriend(undefined));
      setSelectedGroup(groupName);
      setSelectedFriend("");
    },
    [dispatch]
  );

  const handleClickOnFriends = useCallback(
    (friend: string) => {
      dispatch(setActiveFriend(friend));
      dispatch(setActiveGroup(undefined));
      setSelectedFriend(friend);
      setSelectedGroup("");
    },
    [dispatch]
  );

  const handleDeleteGroup = useCallback((groupId: string) => {
    setShowConfirmation(true);
    setGroupToDelete(groupId);
  }, []);

  const confirmDeleteGroup = useCallback(async () => {
    try {
      if (groupToDelete && user?.id) {
        // Find the group being deleted to check if it's the active group
        const groupBeingDeleted = groups.find(
          (group) => group.id === groupToDelete
        );

        const { error } = await supabase
          .from("groups")
          .delete()
          .match({ id: groupToDelete });

        if (error) {
          throw new Error(error.message);
        }

        // Clean up expenses associated with this group
        const { error: expensesError } = await supabase
          .from("expenses")
          .delete()
          .eq("group_id", groupToDelete)
          .eq("user_id", user.id);

        if (expensesError) {
          console.error("Error deleting expenses:", expensesError);
          // Don't throw here as the group is already deleted, just log the error
        }

        // Clean up payments associated with this group
        const paidsResponse = await supabase
          .from("myPaids")
          .select("*")
          .eq("userId", user.id);

        if (paidsResponse.data && paidsResponse.data.length > 0) {
          const currentPaids = paidsResponse.data[0]?.paids || [];
          const cleanedPaids = currentPaids.filter(
            (paid: { groupId?: string; groupName?: string }) => {
              // Remove payments that belong to the deleted group
              if (paid.groupId) {
                return paid.groupId !== groupToDelete;
              } else {
                // For legacy payments without groupId, check groupName
                return paid.groupName !== groupBeingDeleted?.groupName;
              }
            }
          );

          // Update the cleaned payments in the database
          await supabase
            .from("myPaids")
            .update({ paids: cleanedPaids })
            .eq("userId", user.id);

          // Update the Redux store with cleaned payments
          dispatch(setPayments(cleanedPaids));
        }

        const updatedGroups = groups.filter(
          (group) => group.id !== groupToDelete
        );
        dispatch(setGroups(updatedGroups));

        // If the deleted group was the active group, clear the active group and related data
        if (
          groupBeingDeleted &&
          user?.activeGroup === groupBeingDeleted.groupName
        ) {
          dispatch(setActiveGroup(undefined));
          dispatch(setActiveFriend(undefined));
          // Clear the spents data since the active group is deleted
          dispatch(setExpenses([]));
        }

        // Refresh expenses to remove deleted group's expenses from local state
        await fetchExpenses();

        toast.success("Group and associated transactions deleted successfully");
      }

      setGroupToDelete(null);
      setShowConfirmation(false);
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error(`Error deleting group:, ${error}`);
    }
  }, [
    groupToDelete,
    groups,
    dispatch,
    user?.activeGroup,
    user?.id,
    fetchExpenses,
  ]);

  const cancelDeleteGroup = useCallback(() => {
    setGroupToDelete(null);
    setShowConfirmation(false);
  }, []);

  return (
    <div className="right-contianer p-3">
      {showConfirmation && (
        <div className="confirmation-dialog alert alert-danger mt-3 p-2">
          <p className="m-0">Are you sure you want to delete this group?</p>
          <div className="mt-2">
            <button
              className="btn btn-secondary m-1"
              onClick={cancelDeleteGroup}
            >
              Cancel
            </button>
            <button className="btn btn-danger m-1" onClick={confirmDeleteGroup}>
              Confirm
            </button>
          </div>
        </div>
      )}

      <div className="dashboard">
        <img
          src="https://assets.splitwise.com/assets/core/logo-square-65a6124237868b1d2ce2f5db2ab0b7c777e2348b797626816400534116ae22d7.svg"
          className="img-fluid"
          alt="Sample image"
        />
        <p>Dashboard</p>
      </div>

      <div className="group">
        <div className="sec-type">
          <p>GROUPS</p>
          <Link to="/groups/new" className="text-decoration-none">
            <div className="add-btn">
              <i className="fa-solid fa-plus" />
              add
            </div>
          </Link>
        </div>

        <div className="sec-text-area group-list">
          {groups.map((group) => (
            <li
              key={group.id}
              className={`${
                group.groupName === selectedGroup ? "open" : ""
              } d-flex flex-row justify-content-between`}
              onClick={() => handleClickOnGroup(group.groupName)}
            >
              <h6>
                <i className="fa-solid fa-tag"></i>
                {group.groupName}
              </h6>

              <i
                className="fa fa-trash text-danger my-2 icon-button"
                onClick={() => handleDeleteGroup(group.id)}
              />
            </li>
          ))}
        </div>
      </div>

      <div className="friends">
        <div className="sec-type">
          <p>FRIENDS</p>
        </div>

        <div className="sec-text-area">
          {uniqueFriends.flat().map((friend, index) => (
            <li key={index} className={friend === selectedFriend ? "open" : ""}>
              <h6 onClick={() => handleClickOnFriends(friend)}>
                <i className="fa fa-user"></i>
                {friend}
              </h6>
            </li>
          ))}
        </div>
      </div>
    </div>
  );
}

export const GroupsAndFriends = memo(GroupsAndFriendsComponent);
