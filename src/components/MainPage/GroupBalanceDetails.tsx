import { useMemo, useState } from "react";
import {
  calculateAllPairwiseBalances,
  Expense,
} from "../../utils/balanceCalculations";
import { Paid } from "../../types/info-owes";

interface FullGroup {
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

interface GroupBalanceDetailsProps {
  groupMembers: string[];
  expenses: Expense[];
  payments: Paid[];
  viewingUser: string;
  allGroups: FullGroup[]; // All groups for cross-group summary
  allExpenses: Expense[]; // All expenses across groups
  allPayments: Paid[]; // All payments across groups
  onSettleClick?: (userA: string, userB: string) => void;
}

export function GroupBalanceDetails({
  groupMembers,
  expenses,
  payments,
  viewingUser,
  allGroups,
  allExpenses,
  allPayments,
  onSettleClick,
}: GroupBalanceDetailsProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate pairwise balances for current group
  const pairwiseBalances = useMemo(() => {
    return calculateAllPairwiseBalances(groupMembers, expenses, payments);
  }, [groupMembers, expenses, payments]);

  // Calculate overall balance summary across ALL groups
  const overallSummary = useMemo(() => {
    if (!allGroups || allGroups.length === 0) return null;

    // Get all unique users across all groups
    const allUsers = Array.from(
      new Set([
        viewingUser,
        ...allGroups.flatMap((group) => group.friends || []),
      ])
    );

    // Calculate total balance for each user across all groups
    const totalBalances = allUsers.map((userId) => {
      // Get expenses for groups where this user is involved
      const userExpenses = allExpenses.filter(
        (expense) =>
          expense.whoPaid === userId || expense.sharedWith.includes(userId)
      );

      // Get payments involving this user
      const userPayments = allPayments.filter(
        (payment) => payment.whoPaid === userId || payment.toWho === userId
      );

      const balance = userExpenses.reduce((sum, expense) => {
        if (expense.whoPaid === userId) {
          const userShare = expense.sharedWith.includes(userId)
            ? expense.cost / expense.sharedWith.length
            : 0;
          return sum + (expense.cost - userShare);
        } else if (expense.sharedWith.includes(userId)) {
          const userShare = expense.cost / expense.sharedWith.length;
          return sum - userShare;
        }
        return sum;
      }, 0);

      // Apply payments
      const finalBalance = userPayments.reduce((sum, payment) => {
        if (payment.whoPaid === userId) {
          return sum - payment.howMuchPaid;
        } else if (payment.toWho === userId) {
          return sum + payment.howMuchPaid;
        }
        return sum;
      }, balance);

      return {
        userId,
        totalBalance: Number(finalBalance.toFixed(2)),
      };
    });

    return totalBalances;
  }, [allGroups, allExpenses, allPayments, viewingUser]);

  // Helper functions
  const getDisplayName = (userName: string) => {
    return userName === viewingUser ? "You" : userName;
  };

  const formatBalance = (balance: number) => {
    return Math.abs(balance).toFixed(2);
  };

  // Get viewing user's total balance across all groups
  const viewingUserTotalBalance =
    overallSummary?.find((u) => u.userId === viewingUser)?.totalBalance || 0;

  return (
    <div className="group-balance-details">
      {/* Current Group Balances */}
      <div className="current-group-balances">
        <h5 className="right-title">GROUP BALANCES</h5>
        <div className="pairwise-balances">
          {pairwiseBalances
            .filter((pair) => Math.abs(pair.amount) > 0.01) // Only show non-zero balances
            .map((pair, index) => (
              <div
                key={index}
                className="pairwise-balance-item"
                style={{
                  padding: "10px",
                  margin: "5px 0",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  backgroundColor: "#f8f9fa",
                }}
              >
                <div className="balance-description">
                  {pair.amount > 0 ? (
                    <span>
                      <strong>{getDisplayName(pair.userA)}</strong> owes{" "}
                      <strong>{getDisplayName(pair.userB)}</strong>{" "}
                      <span className="text-danger">
                        ${formatBalance(pair.amount)}
                      </span>
                    </span>
                  ) : (
                    <span>
                      <strong>{getDisplayName(pair.userB)}</strong> owes{" "}
                      <strong>{getDisplayName(pair.userA)}</strong>{" "}
                      <span className="text-danger">
                        ${formatBalance(pair.amount)}
                      </span>
                    </span>
                  )}
                </div>
                {onSettleClick && (
                  <button
                    className="btn btn-sm btn-outline-primary mt-2"
                    onClick={() => {
                      const creditor =
                        pair.amount > 0 ? pair.userB : pair.userA;
                      const debtor = pair.amount > 0 ? pair.userA : pair.userB;
                      onSettleClick(debtor, creditor);
                    }}
                  >
                    Settle up
                  </button>
                )}
              </div>
            ))}

          {pairwiseBalances.every((pair) => Math.abs(pair.amount) <= 0.01) && (
            <div className="text-center py-3">
              <span className="text-muted">
                All members are settled up in this group
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Overall Balance Summary */}
      {overallSummary && (
        <div className="overall-summary mt-4">
          <div className="summary-header">
            <h5>BALANCE SUMMARY (All Groups)</h5>
            <button
              className="btn btn-link btn-sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Hide Details" : "Show Details"}
            </button>
          </div>

          <div className="current-user-summary">
            <div
              className={`balance-card p-3 mb-3 ${
                viewingUserTotalBalance > 0
                  ? "border-success"
                  : viewingUserTotalBalance < 0
                  ? "border-danger"
                  : "border-secondary"
              }`}
              style={{ border: "2px solid", borderRadius: "8px" }}
            >
              <h6 className="mb-2">
                {getDisplayName(viewingUser)} - Total Balance
              </h6>
              <div className="balance-amount">
                {viewingUserTotalBalance > 0 ? (
                  <div className="text-success">
                    <strong>
                      Are owed: ${formatBalance(viewingUserTotalBalance)}
                    </strong>
                  </div>
                ) : viewingUserTotalBalance < 0 ? (
                  <div className="text-danger">
                    <strong>
                      Owe in total: ${formatBalance(viewingUserTotalBalance)}
                    </strong>
                  </div>
                ) : (
                  <div className="text-muted">
                    <strong>All settled up</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showDetails && (
            <div className="detailed-breakdown">
              <h6>Detailed Breakdown by User:</h6>
              <div className="user-balances">
                {overallSummary
                  .filter((user) => user.userId !== viewingUser)
                  .map((user) => (
                    <div
                      key={user.userId}
                      className="user-balance-item d-flex justify-content-between align-items-center py-2 px-3 mb-2"
                      style={{
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                        border: "1px solid #dee2e6",
                      }}
                    >
                      <span className="user-name">
                        {getDisplayName(user.userId)}
                      </span>
                      <span
                        className={`balance ${
                          user.totalBalance > 0
                            ? "text-success"
                            : user.totalBalance < 0
                            ? "text-danger"
                            : "text-muted"
                        }`}
                      >
                        {user.totalBalance > 0
                          ? `Gets back $${formatBalance(user.totalBalance)}`
                          : user.totalBalance < 0
                          ? `Owes $${formatBalance(user.totalBalance)}`
                          : "Settled up"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
