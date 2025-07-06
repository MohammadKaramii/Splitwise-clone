import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "../../supabase";
import {
  setUser,
  clearUser,
  setActiveGroup,
  setActiveFriend,
  setLoading,
  setError,
} from "../redux/slices/authSlice";
import type { RootState } from "../redux/store";
import { AuthData } from "../types";
import toast from "react-hot-toast";

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const signIn = useCallback(
    async (authData: AuthData) => {
      dispatch(setLoading(true));
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authData.email,
          password: authData.password,
        });

        if (error) throw error;

        if (data.user) {
          dispatch(
            setUser({
              id: data.user.id,
              name: data.user.user_metadata.name || data.user.email || "",
              email: data.user.email || "",
              isSignedIn: true,
            })
          );
          toast.success("Signed in successfully!");
          return { success: true };
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Sign in failed";
        dispatch(setError(message));
        toast.error(message);
        return { success: false, error: message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const signUp = useCallback(
    async (authData: AuthData) => {
      dispatch(setLoading(true));
      try {
        const { error } = await supabase.auth.signUp({
          email: authData.email,
          password: authData.password,
          options: {
            data: {
              name: authData.name,
            },
          },
        });

        if (error) throw error;

        toast.success("Account created! Check your email for verification.");
        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Sign up failed";
        dispatch(setError(message));
        toast.error(message);
        return { success: false, error: message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const signOut = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      await supabase.auth.signOut();
      dispatch(clearUser());
      toast.success("Signed out successfully!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign out failed";
      dispatch(setError(message));
      toast.error(message);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const setActiveGroupHandler = useCallback(
    (groupName?: string) => {
      dispatch(setActiveGroup(groupName));
      dispatch(setActiveFriend(undefined));
    },
    [dispatch]
  );

  const setActiveFriendHandler = useCallback(
    (friendName?: string) => {
      dispatch(setActiveFriend(friendName));
      dispatch(setActiveGroup(undefined));
    },
    [dispatch]
  );

  return {
    user,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    setActiveGroup: setActiveGroupHandler,
    setActiveFriend: setActiveFriendHandler,
    isAuthenticated: !!user?.isSignedIn,
  };
};
