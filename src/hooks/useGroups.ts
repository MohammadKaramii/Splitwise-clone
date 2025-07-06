import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "../../supabase";
import {
  setGroups,
  addGroup,
  removeGroup,
  setLoading,
  setError,
} from "../redux/slices/groupsSlice";
import type { RootState } from "../redux/store";
import { CreateGroupData } from "../types";
import { validateGroupNameUniqueness } from "../utils/validation";
import toast from "react-hot-toast";
import { uid } from "uid";

export const useGroups = () => {
  const dispatch = useDispatch();
  const { groups, isLoading, error } = useSelector(
    (state: RootState) => state.groups
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const fetchGroups = useCallback(async () => {
    if (!user?.id) return;

    dispatch(setLoading(true));
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("userId", user.id);

      if (error) throw error;

      dispatch(setGroups(data || []));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch groups";
      dispatch(setError(message));
      toast.error(message);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, user?.id]);

  const createGroup = useCallback(
    async (groupData: CreateGroupData) => {
      if (!user?.id) return { success: false, error: "User not authenticated" };

      const validationError = validateGroupNameUniqueness(
        groupData.name,
        groups
      );
      if (validationError) {
        toast.error(validationError);
        return { success: false, error: validationError };
      }

      dispatch(setLoading(true));
      try {
        const newGroup = {
          id: uid(),
          groupName: groupData.name,
          friends: groupData.members.map((member) => member.name),
          userId: user.id,
          lastUpdate: new Date().toISOString(),
        };

        const { error } = await supabase.from("groups").insert([newGroup]);

        if (error) throw error;

        dispatch(addGroup(newGroup));
        toast.success("Group created successfully!");
        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create group";
        dispatch(setError(message));
        toast.error(message);
        return { success: false, error: message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, user?.id, groups]
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      dispatch(setLoading(true));
      try {
        const { error } = await supabase
          .from("groups")
          .delete()
          .eq("id", groupId);

        if (error) throw error;

        dispatch(removeGroup(groupId));
        toast.success("Group deleted successfully!");
        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to delete group";
        dispatch(setError(message));
        toast.error(message);
        return { success: false, error: message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const getGroupById = useCallback(
    (groupId: string) => {
      return groups.find((group) => group.id === groupId);
    },
    [groups]
  );

  const getGroupByName = useCallback(
    (groupName: string) => {
      return groups.find((group) => group.groupName === groupName);
    },
    [groups]
  );

  const getCurrentGroup = useCallback(() => {
    if (!user?.activeGroup) return null;
    return getGroupByName(user.activeGroup);
  }, [user?.activeGroup, getGroupByName]);

  return {
    groups,
    isLoading,
    error,
    fetchGroups,
    createGroup,
    deleteGroup,
    getGroupById,
    getGroupByName,
    getCurrentGroup,
  };
};
