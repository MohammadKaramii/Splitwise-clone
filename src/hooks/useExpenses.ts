import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "../../supabase";
import {
  setExpenses,
  addExpense,
  removeExpense,
  setLoading,
  setError,
} from "../redux/slices/expensesSlice";
import type { RootState } from "../redux/store";
import { CreateExpenseData } from "../types";
import toast from "react-hot-toast";
import { uid } from "uid";

export const useExpenses = () => {
  const dispatch = useDispatch();
  const {
    items: expenses,
    isLoading,
    error,
  } = useSelector((state: RootState) => state.expenses);
  const { user } = useSelector((state: RootState) => state.auth);
  const { groups } = useSelector((state: RootState) => state.groups);

  const fetchExpenses = useCallback(async () => {
    if (!user?.id) return;

    dispatch(setLoading(true));
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      const formattedExpenses = (data || []).map((expense) => ({
        id: expense.id,
        message: expense.description || "",
        cost: expense.amount || 0,
        createdAt: expense.created_at || "",
        whoPaid: expense.paid_by || "",
        sharedWith: expense.shared_with || [],
        groupId: expense.group_id || "",
      }));

      dispatch(setExpenses(formattedExpenses));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch expenses";
      dispatch(setError(message));
      toast.error(message);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, user?.id]);

  const createExpense = useCallback(
    async (expenseData: CreateExpenseData) => {
      if (!user?.id) return { success: false, error: "User not authenticated" };

      dispatch(setLoading(true));
      try {
        const expenseId = uid();
        const newExpense = {
          id: expenseId,
          description: expenseData.description,
          amount: expenseData.amount,
          paid_by: expenseData.paidBy,
          shared_with: expenseData.sharedWith,
          group_id: expenseData.groupId,
          user_id: user.id,
          created_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("expenses").insert([newExpense]);

        if (error) throw error;

        const formattedExpense = {
          id: expenseId,
          message: expenseData.description,
          cost: expenseData.amount,
          createdAt: new Date().toISOString(),
          whoPaid: expenseData.paidBy,
          sharedWith: expenseData.sharedWith,
          groupId: expenseData.groupId,
        };

        dispatch(addExpense(formattedExpense));
        toast.success("Expense added successfully!");
        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create expense";
        dispatch(setError(message));
        toast.error(message);
        return { success: false, error: message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, user?.id]
  );

  const deleteExpense = useCallback(
    async (expenseId: string) => {
      dispatch(setLoading(true));
      try {
        const { error } = await supabase
          .from("expenses")
          .delete()
          .eq("id", expenseId);

        if (error) throw error;

        dispatch(removeExpense(expenseId));
        toast.success("Expense deleted successfully!");
        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to delete expense";
        dispatch(setError(message));
        toast.error(message);
        return { success: false, error: message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const getCurrentGroupExpenses = useCallback(() => {
    if (!user?.activeGroup) return [];

    const currentGroup = groups?.find(
      (group) => group.groupName === user.activeGroup
    );
    if (!currentGroup) return [];

    return expenses.filter((expense) => expense.groupId === currentGroup.id);
  }, [expenses, user?.activeGroup, groups]);

  return {
    expenses,
    isLoading,
    error,
    fetchExpenses,
    createExpense,
    deleteExpense,
    getCurrentGroupExpenses,
  };
};
