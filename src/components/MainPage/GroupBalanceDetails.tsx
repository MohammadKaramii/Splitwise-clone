import { useMemo, useState } from "react";
import {
  calculateAllPairwiseBalances,
  calculateOverallBalances,
  Expense,
} from "../../utils/balanceCalculations";
import { Payment } from "../../types/core";
import { useExpenses } from "../../hooks";

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
  payments: Payment[];
  viewingUser: string;
  allGroups: FullGroup[]; // All groups for cross-group summary
  allPayments: Payment[]; // All payments across groups
  onSettleClick?: (userA: string, userB: string) => void;
  onSettleAllClick?: () => void;
}

export function GroupBalanceDetails({
  groupMembers,
  expenses,
  payments,
  viewingUser,
  allGroups,
  allPayments,
  onSettleClick,
  onSettleAllClick,
}: GroupBalanceDetailsProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { expenses: allExpenses } = useExpenses();

  // Calculate pairwise balances for current group
  const pairwiseBalances = useMemo(() => {
    const paidPayments = payments.map((payment) => ({
      whoPaid: payment.from,
      howMuchPaid: payment.amount,
      toWho: payment.to,
      groupId: payment.groupId,
    }));
    return calculateAllPairwiseBalances(groupMembers, expenses, paidPayments);
  }, [groupMembers, expenses, payments]);

  // Calculate overall balance summary across ALL groups using centralized function
  const overallSummary = useMemo(() => {
    if (!allGroups || allGroups.length === 0) return null;

    // Convert all expenses to the format expected by balance calculations
    const allGroupsExpenses = allGroups.map((group) => {
      // Get expenses for this group from the expenses table
      const groupExpenses = allExpenses.filter(
        (expense) => expense.groupId === group.id
      );

      return {
        groupId: group.id,
        expenses: groupExpenses.map((expense) => ({
          cost: expense.cost,
          whoPaid: expense.whoPaid,
          sharedWith: expense.sharedWith as string[],
        })),
      };
    });

    const paidPayments = allPayments.map((payment) => ({
      whoPaid: payment.from,
      howMuchPaid: payment.amount,
      toWho: payment.to,
      groupId: payment.groupId,
    }));

    const balances = calculateOverallBalances(
      allGroups,
      allGroupsExpenses,
      paidPayments,
      viewingUser
    );

    return balances.map((balance) => ({
      userId: balance.userId,
      totalBalance: balance.balance,
    }));
  }, [allGroups, allPayments, viewingUser, allExpenses]);

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
      <div className="current-group-balances">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="right-title">GROUP BALANCES</h5>
          {onSettleAllClick &&
            pairwiseBalances.some((pair) => Math.abs(pair.amount) > 0.01) && (
              <button
                className="btn btn-success btn-sm"
                onClick={onSettleAllClick}
              >
                Settle All Debts
              </button>
            )}
        </div>
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
