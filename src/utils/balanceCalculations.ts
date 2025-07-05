import { Paid } from "../types/info-owes";

export interface Expense {
  cost: number;
  whoPaid: string;
  sharedWith: string[];
}

export interface UserBalance {
  userId: string;
  balance: number; // positive = they are owed money, negative = they owe money
}

export interface PairwiseBalance {
  userA: string;
  userB: string;
  amount: number; // positive = userA owes userB, negative = userB owes userA
}

/**
 * Calculate the net balance for a specific user in a group
 * Returns positive if user is owed money, negative if user owes money
 */
export function calculateUserBalance(
  userId: string,
  expenses: Expense[],
  payments: Paid[]
): number {
  let balance = 0;

  // Calculate balance from expenses
  for (const expense of expenses) {
    if (expense.whoPaid === userId) {
      // User paid for this expense - they should get back the amount minus their share
      const userShare = expense.sharedWith.includes(userId)
        ? expense.cost / expense.sharedWith.length
        : 0;
      balance += expense.cost - userShare;
    } else if (expense.sharedWith.includes(userId)) {
      // User didn't pay but owes their share
      const userShare = expense.cost / expense.sharedWith.length;
      balance -= userShare;
    }
  }

  // Calculate balance from payments
  for (const payment of payments) {
    if (payment.whoPaid === userId) {
      // User made a payment - reduces their balance (they paid what they owed)
      balance -= payment.howMuchPaid;
    } else if (payment.toWho === userId) {
      // User received a payment - increases their balance
      balance += payment.howMuchPaid;
    }
  }

  return Number(balance.toFixed(2));
}

/**
 * Calculate how much userA owes userB (or vice versa)
 * Returns positive if userA owes userB, negative if userB owes userA
 */
export function calculatePairwiseBalance(
  userA: string,
  userB: string,
  expenses: Expense[],
  payments: Paid[]
): number {
  let balance = 0;

  // Calculate balance from shared expenses
  for (const expense of expenses) {
    const isUserAInvolved =
      expense.whoPaid === userA || expense.sharedWith.includes(userA);
    const isUserBInvolved =
      expense.whoPaid === userB || expense.sharedWith.includes(userB);

    if (!isUserAInvolved && !isUserBInvolved) continue;

    const shareAmount = expense.cost / expense.sharedWith.length;

    if (expense.whoPaid === userA && expense.sharedWith.includes(userB)) {
      // UserA paid, UserB owes their share to UserA
      balance -= shareAmount; // UserB owes UserA
    } else if (
      expense.whoPaid === userB &&
      expense.sharedWith.includes(userA)
    ) {
      // UserB paid, UserA owes their share to UserB
      balance += shareAmount; // UserA owes UserB
    }
  }

  // Calculate balance from direct payments between the two users
  for (const payment of payments) {
    if (payment.whoPaid === userA && payment.toWho === userB) {
      // UserA paid UserB - reduces what UserA owes UserB
      balance -= payment.howMuchPaid;
    } else if (payment.whoPaid === userB && payment.toWho === userA) {
      // UserB paid UserA - increases what UserA owes UserB
      balance += payment.howMuchPaid;
    }
  }

  return Number(balance.toFixed(2));
}

/**
 * Calculate balances for all users in a group
 */
export function calculateGroupBalances(
  groupMembers: string[],
  expenses: Expense[],
  payments: Paid[]
): UserBalance[] {
  return groupMembers.map((userId) => ({
    userId,
    balance: calculateUserBalance(userId, expenses, payments),
  }));
}

/**
 * Calculate all pairwise balances in a group
 */
export function calculateAllPairwiseBalances(
  groupMembers: string[],
  expenses: Expense[],
  payments: Paid[]
): PairwiseBalance[] {
  const balances: PairwiseBalance[] = [];

  for (let i = 0; i < groupMembers.length; i++) {
    for (let j = i + 1; j < groupMembers.length; j++) {
      const userA = groupMembers[i];
      const userB = groupMembers[j];
      const amount = calculatePairwiseBalance(userA, userB, expenses, payments);

      balances.push({
        userA,
        userB,
        amount,
      });
    }
  }

  return balances;
}

/**
 * Get simplified settlement suggestions for a group
 * Returns the minimum number of transactions needed to settle all balances
 */
export function getSettlementSuggestions(
  groupMembers: string[],
  expenses: Expense[],
  payments: Paid[]
): Array<{ from: string; to: string; amount: number }> {
  const balances = calculateGroupBalances(groupMembers, expenses, payments);
  const suggestions: Array<{ from: string; to: string; amount: number }> = [];

  // Create arrays of creditors (positive balance) and debtors (negative balance)
  const creditors = balances
    .filter((b) => b.balance > 0.01)
    .map((b) => ({ userId: b.userId, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = balances
    .filter((b) => b.balance < -0.01)
    .map((b) => ({ userId: b.userId, amount: Math.abs(b.balance) }))
    .sort((a, b) => b.amount - a.amount);

  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    const settleAmount = Math.min(creditor.amount, debtor.amount);

    if (settleAmount > 0.01) {
      suggestions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Number(settleAmount.toFixed(2)),
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount < 0.01) creditorIndex++;
    if (debtor.amount < 0.01) debtorIndex++;
  }

  return suggestions;
}
