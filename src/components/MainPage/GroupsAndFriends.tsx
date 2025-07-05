import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setSignInUserData,
  selectUserData,
} from "../../redux/reducers/userDataSlice";
import { Link } from "react-router-dom";
import { supabase } from "../../../supabase";
import { setGroupData } from "../../redux/reducers/groupSlice";
import toast from "react-hot-toast";
import { setSpents } from "../../redux/reducers/spentsSlice";
import { RootState } from "../../redux/store";
import { setAddPayment } from "../../redux/reducers/paidSlice";
import { Group } from "../../types";

function GroupsAndFriendsComponent() {
  const userData = useSelector(selectUserData);
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.userData.user);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedFriend, setSelectedFriend] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const fetchGroupsData = useCallback(async () => {
    const groupsResponse = await supabase
      .from("groups")
      .select("*")
      .eq("userId", userData.id);
    const { data: groupsData, error: groupsError } = groupsResponse;

    if (groupsError) {
      throw new Error(groupsError.message);
    }

    setGroups(groupsData || []);
    dispatch(setGroupData(groupsData));
  }, [dispatch, userData.id]);

  const fetchPaidsData = useCallback(async () => {
    const paidsResponse = await supabase
      .from("myPaids")
      .select("*")
      .eq("userId", userData.id);
    const { data: paids, error: paidsError } = paidsResponse;

    if (paidsError) {
      throw new Error(paidsError.message);
    }

    dispatch(setAddPayment(paids[0]?.paids || []));
  }, [dispatch, userData.id]);

  const fetchSpentsData = useCallback(async () => {
    const spentsResponse = await supabase
      .from("groups")
      .select("howSpent")
      .eq("groupName", user.activeGroup)
      .eq("userId", userData.id);
    const { data: spents, error: spentsError } = spentsResponse;

    if (spentsError) {
      throw new Error(spentsError.message);
    }

    dispatch(setSpents(spents[0]?.howSpent || []));
  }, [dispatch, user.activeGroup, userData.id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchGroupsData();
        await fetchPaidsData();

        if (user.activeGroup) {
          await fetchSpentsData();
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [
    dispatch,
    fetchGroupsData,
    fetchPaidsData,
    fetchSpentsData,
    user.activeGroup,
    userData.id,
  ]);
  const uniqueFriends = useMemo(() => {
    const friends = groups.map((group) => group.friends);
    return Array.from(new Set(friends.flat()));
  }, [groups]);

  const handleClickOnGroup = useCallback(
    (groupName: string) => {
      dispatch(
        setSignInUserData({
          activeGroup: groupName,
          activeFriend: null,
        })
      );
      setSelectedGroup(groupName);
      setSelectedFriend("");
    },
    [dispatch]
  );

  const handleClickOnFriends = useCallback(
    (friend: string) => {
      dispatch(
        setSignInUserData({
          activeFriend: friend,
          activeGroup: null,
        })
      );
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
      if (groupToDelete) {
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

        // Clean up payments associated with this group
        const paidsResponse = await supabase
          .from("myPaids")
          .select("*")
          .eq("userId", userData.id);

        if (paidsResponse.data && paidsResponse.data.length > 0) {
          const currentPaids = paidsResponse.data[0]?.paids || [];
          const cleanedPaids = currentPaids.filter((paid: any) => {
            // Remove payments that belong to the deleted group
            if (paid.groupId) {
              return paid.groupId !== groupToDelete;
            } else {
              // For legacy payments without groupId, check groupName
              return paid.groupName !== groupBeingDeleted?.groupName;
            }
          });

          // Update the cleaned payments in the database
          await supabase
            .from("myPaids")
            .update({ paids: cleanedPaids })
            .eq("userId", userData.id);

          // Update the Redux store with cleaned payments
          dispatch(setAddPayment(cleanedPaids));
        }

        const updatedGroups = groups.filter(
          (group) => group.id !== groupToDelete
        );
        setGroups(updatedGroups);
        dispatch(setGroupData(updatedGroups));

        // If the deleted group was the active group, clear the active group and related data
        if (
          groupBeingDeleted &&
          user.activeGroup === groupBeingDeleted.groupName
        ) {
          dispatch(
            setSignInUserData({
              activeGroup: null,
              activeFriend: null,
            })
          );
          // Clear the spents data since the active group is deleted
          dispatch(setSpents([]));
        }

        toast.success("Group and associated transactions deleted successfully");
      }

      setGroupToDelete(null);
      setShowConfirmation(false);
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error(`Error deleting group:, ${error}`);
    }
  }, [groupToDelete, groups, dispatch, user.activeGroup, userData.id]);

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
