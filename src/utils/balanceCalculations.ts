import { Paid } from "../types/info-owes";

interface Group {
  id: string;
  groupName: string;
  friends: string[];
  howSpent?: Array<{
    message: string;
    cost: number;
    id: string;
    createdAt: string;
    whoPaid: string;
    sharedWith: string[];
  }>;
  userId: string;
  lastUpdate: string;
}

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

/**
 * Calculate overall balance for a user across all groups
 * Returns positive if user is owed money, negative if user owes money
 */
export function calculateOverallUserBalance(
  userId: string,
  allGroups: Group[],
  allPayments: Paid[]
): number {
  let balance = 0;

  // Calculate balance from expenses across all groups
  allGroups.forEach((group) => {
    const groupExpenses = (group.howSpent || []).map((spent) => ({
      cost: spent.cost,
      whoPaid: spent.whoPaid,
      sharedWith: spent.sharedWith as string[],
    }));

    // Filter payments for this group
    const groupPayments = getGroupPayments(allPayments, group);

    // Add this group's balance to the total
    balance += calculateUserBalance(userId, groupExpenses, groupPayments);
  });

  return Number(balance.toFixed(2));
}

/**
 * Calculate overall balances for all users across all groups
 */
export function calculateOverallBalances(
  allGroups: Group[],
  allPayments: Paid[],
  currentUserName?: string
): UserBalance[] {
  // Get all unique user NAMES across all groups (not UUIDs)
  const allUserNames = new Set<string>();

  // Add the current user's name if provided
  if (currentUserName) {
    allUserNames.add(currentUserName);
  }

  allGroups.forEach((group) => {
    // Add friends (which are already names)
    (group.friends || []).forEach((friend) => allUserNames.add(friend));

    // Try to find the group owner's name from expenses if current user name not provided
    if (!currentUserName && group.howSpent && group.howSpent.length > 0) {
      // Get all unique payers from this group's expenses
      const payers = Array.from(
        new Set(group.howSpent.map((spent) => spent.whoPaid))
      );

      // Find a payer who is not in the friends list (this should be the owner)
      const ownerName = payers.find((payer) => !group.friends.includes(payer));
      if (ownerName) {
        allUserNames.add(ownerName);
      }
    }
  });

  const allUsers = Array.from(allUserNames);

  return allUsers.map((userName) => ({
    userId: userName, // Use name as userId for consistency
    balance: calculateOverallUserBalance(userName, allGroups, allPayments),
  }));
}

/**
 * Get payments filtered for a specific group with backwards compatibility
 */
export function getGroupPayments(
  allPayments: Paid[],
  group: { id: string; groupName: string }
): Paid[] {
  return allPayments.filter((payment) => {
    // Prefer groupId if available, fallback to groupName for backwards compatibility
    if (payment.groupId) {
      return payment.groupId === group.id;
    } else {
      return payment.groupName === group.groupName;
    }
  });
}
