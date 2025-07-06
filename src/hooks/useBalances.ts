import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { Balance, PairwiseBalance } from "../types";

export const useBalances = () => {
  const { items: expenses } = useSelector((state: RootState) => state.expenses);
  const { items: payments } = useSelector((state: RootState) => state.payments);
  const { groups } = useSelector((state: RootState) => state.groups);
  const { user } = useSelector((state: RootState) => state.auth);

  const calculatePairwiseBalance = useMemo(() => {
    return (
      userA: string,
      userB: string,
      groupExpenses = expenses,
      groupPayments = payments
    ): number => {
      let balance = 0;

      groupExpenses.forEach((expense) => {
        const isUserAInvolved =
          expense.whoPaid === userA || expense.sharedWith.includes(userA);
        const isUserBInvolved =
          expense.whoPaid === userB || expense.sharedWith.includes(userB);

        if (!isUserAInvolved && !isUserBInvolved) return;

        const shareAmount = expense.cost / expense.sharedWith.length;

        if (expense.whoPaid === userA && expense.sharedWith.includes(userB)) {
          balance -= shareAmount;
        } else if (
          expense.whoPaid === userB &&
          expense.sharedWith.includes(userA)
        ) {
          balance += shareAmount;
        }
      });

      groupPayments.forEach((payment) => {
        if (payment.whoPaid === userA && payment.toWho === userB) {
          balance -= payment.howMuchPaid;
        } else if (payment.whoPaid === userB && payment.toWho === userA) {
          balance += payment.howMuchPaid;
        }
      });

      return Number(balance.toFixed(2));
    };
  }, [expenses, payments]);

  const getCurrentGroupBalances = useMemo(() => {
    if (!user?.activeGroup) return [];

    const currentGroup = groups.find(
      (group) => group.groupName === user.activeGroup
    );
    if (!currentGroup) return [];

    const members = [user.name, ...currentGroup.friends];
    const balances: Balance[] = [];

    members.forEach((member) => {
      let totalBalance = 0;

      members.forEach((otherMember) => {
        if (member !== otherMember) {
          totalBalance += calculatePairwiseBalance(member, otherMember);
        }
      });

      balances.push({
        userId: member,
        amount: Number(totalBalance.toFixed(2)),
      });
    });

    return balances;
  }, [user?.activeGroup, user?.name, groups, calculatePairwiseBalance]);

  const getPairwiseBalances = useMemo(() => {
    if (!user?.activeGroup) return [];

    const currentGroup = groups.find(
      (group) => group.groupName === user.activeGroup
    );
    if (!currentGroup) return [];

    const members = [user.name, ...currentGroup.friends];
    const pairwiseBalances: PairwiseBalance[] = [];

    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const userA = members[i];
        const userB = members[j];
        const balance = calculatePairwiseBalance(userA, userB);

        if (Math.abs(balance) > 0.01) {
          pairwiseBalances.push({
            userA,
            userB,
            amount: balance,
          });
        }
      }
    }

    return pairwiseBalances;
  }, [user?.activeGroup, user?.name, groups, calculatePairwiseBalance]);

  const getSettlementSuggestions = useMemo(() => {
    const balances = getCurrentGroupBalances;
    const suggestions: PairwiseBalance[] = [];

    const debtors = balances
      .filter((b) => b.amount > 0)

      .map((b) => ({ ...b }))
      .sort((a, b) => b.amount - a.amount);
    const creditors = balances
      .filter((b) => b.amount < 0)
      .map((b) => ({ ...b }))
      .sort((a, b) => a.amount - b.amount);

    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];

      const settleAmount = Math.min(debtor.amount, Math.abs(creditor.amount));

      if (settleAmount > 0.01) {
        suggestions.push({
          userA: debtor.userId,
          userB: creditor.userId,
          amount: settleAmount,
        });
      }

      debtor.amount -= settleAmount;
      creditor.amount += settleAmount;

      if (debtor.amount < 0.01) debtorIndex++;
      if (Math.abs(creditor.amount) < 0.01) creditorIndex++;
    }

    return suggestions;
  }, [getCurrentGroupBalances]);

  const getUserTotalBalance = useMemo(() => {
    return (userId: string): number => {
      return (
        getCurrentGroupBalances.find((b) => b.userId === userId)?.amount || 0
      );
    };
  }, [getCurrentGroupBalances]);

  const formatAmount = (amount: number): string => {
    return Math.abs(amount).toFixed(2);
  };

  const isOwed = (amount: number): boolean => amount < 0;
  const owes = (amount: number): boolean => amount > 0;

  return {
    calculatePairwiseBalance,
    getCurrentGroupBalances,
    getPairwiseBalances,
    getSettlementSuggestions,
    getUserTotalBalance,
    formatAmount,
    isOwed,
    owes,
  };
};
