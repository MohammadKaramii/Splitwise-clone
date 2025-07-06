interface Paid {
  id?: string;
  whoPaid: string;
  howMuchPaid: number;
  toWho: string;
  groupName?: string;
  groupId?: string;
}

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
  balance: number;
}

export interface PairwiseBalance {
  userA: string;
  userB: string;
  amount: number;
}

export function calculateUserBalance(
  userId: string,
  expenses: Expense[],
  payments: Paid[]
): number {
  let balance = 0;

  for (const expense of expenses) {
    if (expense.whoPaid === userId) {
      const userShare = expense.sharedWith.includes(userId)
        ? expense.cost / expense.sharedWith.length
        : 0;
      balance += expense.cost - userShare;
    } else if (expense.sharedWith.includes(userId)) {
      const userShare = expense.cost / expense.sharedWith.length;
      balance -= userShare;
    }
  }

  for (const payment of payments) {
    if (payment.whoPaid === userId) {
      balance -= payment.howMuchPaid;
    } else if (payment.toWho === userId) {
      balance += payment.howMuchPaid;
    }
  }

  return Number(balance.toFixed(2));
}

export function calculatePairwiseBalance(
  userA: string,
  userB: string,
  expenses: Expense[],
  payments: Paid[]
): number {
  let balance = 0;

  for (const expense of expenses) {
    const isUserAInvolved =
      expense.whoPaid === userA || expense.sharedWith.includes(userA);
    const isUserBInvolved =
      expense.whoPaid === userB || expense.sharedWith.includes(userB);

    if (!isUserAInvolved && !isUserBInvolved) continue;

    const shareAmount = expense.cost / expense.sharedWith.length;

    if (expense.whoPaid === userA && expense.sharedWith.includes(userB)) {
      balance -= shareAmount;
    } else if (
      expense.whoPaid === userB &&
      expense.sharedWith.includes(userA)
    ) {
      balance += shareAmount;
    }
  }

  for (const payment of payments) {
    if (payment.whoPaid === userA && payment.toWho === userB) {
      balance -= payment.howMuchPaid;
    } else if (payment.whoPaid === userB && payment.toWho === userA) {
      balance += payment.howMuchPaid;
    }
  }

  return Number(balance.toFixed(2));
}

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

export function getSettlementSuggestions(
  groupMembers: string[],
  expenses: Expense[],
  payments: Paid[]
): Array<{ from: string; to: string; amount: number }> {
  const balances = calculateGroupBalances(groupMembers, expenses, payments);
  const suggestions: Array<{ from: string; to: string; amount: number }> = [];

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

export function calculateOverallUserBalance(
  userId: string,
  allGroupsExpenses: { groupId: string; expenses: Expense[] }[],
  allPayments: Paid[]
): number {
  let balance = 0;

  allGroupsExpenses.forEach((groupExpenses) => {
    const groupPayments = allPayments.filter(
      (payment) => payment.groupId === groupExpenses.groupId
    );

    balance += calculateUserBalance(
      userId,
      groupExpenses.expenses,
      groupPayments
    );
  });

  return Number(balance.toFixed(2));
}

export function calculateOverallBalances(
  allGroups: Group[],
  allGroupsExpenses: { groupId: string; expenses: Expense[] }[],
  allPayments: Paid[],
  currentUserName?: string
): UserBalance[] {
  const allUserNames = new Set<string>();

  if (currentUserName) {
    allUserNames.add(currentUserName);
  }

  allGroups.forEach((group) => {
    (group.friends || []).forEach((friend) => allUserNames.add(friend));

    if (!currentUserName) {
      const groupExpenses = allGroupsExpenses.find(
        (ge) => ge.groupId === group.id
      );
      if (groupExpenses && groupExpenses.expenses.length > 0) {
        const payers = Array.from(
          new Set(groupExpenses.expenses.map((expense) => expense.whoPaid))
        );

        const ownerName = payers.find(
          (payer) => !group.friends.includes(payer)
        );
        if (ownerName) {
          allUserNames.add(ownerName);
        }
      }
    }
  });

  const allUsers = Array.from(allUserNames);

  return allUsers.map((userName) => ({
    userId: userName,
    balance: calculateOverallUserBalance(
      userName,
      allGroupsExpenses,
      allPayments
    ),
  }));
}

export function getGroupPayments(
  allPayments: Paid[],
  group: { id: string; groupName: string }
): Paid[] {
  return allPayments.filter((payment) => {
    if (payment.groupId) {
      return payment.groupId === group.id;
    } else {
      return payment.groupName === group.groupName;
    }
  });
}
