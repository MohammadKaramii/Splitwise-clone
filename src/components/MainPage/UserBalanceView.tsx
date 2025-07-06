import { useMemo } from "react";
import {
  calculateUserBalance,
  calculateGroupBalances,
  Expense,
} from "../../utils/balanceCalculations";
import { Payment } from "../../types/core";

interface UserBalanceViewProps {
  targetUser: string; // The user whose balance we want to display
  groupMembers: string[];
  expenses: Expense[];
  payments: Payment[];
  viewingUser: string; // The user who is currently viewing (for "You" display)
  showIndividual?: boolean;
  showGroupSummary?: boolean;
}

export function UserBalanceView({
  targetUser,
  groupMembers,
  expenses,
  payments,
  viewingUser,
  showIndividual = true,
  showGroupSummary = false,
}: UserBalanceViewProps) {
  // Calculate balance for the target user
  const userBalance = useMemo(() => {
    const paidPayments = payments.map((payment) => ({
      id: payment.id,
      whoPaid: payment.from,
      howMuchPaid: payment.amount,
      toWho: payment.to,
      groupId: payment.groupId,
    }));
    return calculateUserBalance(targetUser, expenses, paidPayments);
  }, [targetUser, expenses, payments]);

  // Calculate balances for all group members if needed
  const allBalances = useMemo(() => {
    if (!showGroupSummary) return [];
    const paidPayments = payments.map((payment) => ({
      id: payment.id,
      whoPaid: payment.from,
      howMuchPaid: payment.amount,
      toWho: payment.to,
      groupId: payment.groupId,
    }));
    return calculateGroupBalances(groupMembers, expenses, paidPayments);
  }, [groupMembers, expenses, payments, showGroupSummary]);

  // Helper function to get display name
  const getDisplayName = (userName: string) => {
    return userName === viewingUser ? "You" : userName;
  };

  const formatBalance = (balance: number) => {
    return Math.abs(balance).toFixed(2);
  };

  const getBalanceClass = (balance: number) => {
    if (balance > 0) return "price";
    if (balance < 0) return "price-lose";
    return "price-zero";
  };

  if (!showIndividual && !showGroupSummary) {
    return null;
  }

  return (
    <div className="balance-view">
      {showIndividual && (
        <div className="individual-balance">
          <table className="table table-bordered">
            <tbody>
              <tr>
                <td scope="col">
                  <div className="flex-grow-1">
                    <p className="mb-1 font-weight-light">
                      {getDisplayName(targetUser)} - total balance
                    </p>
                    <p
                      className={`font-weight-light ${getBalanceClass(
                        userBalance
                      )}`}
                    >
                      ${formatBalance(userBalance)}
                    </p>
                  </div>
                </td>
                <td scope="col">
                  <div className="flex-grow-1">
                    <p className="mb-1 font-weight-light">
                      {getDisplayName(targetUser)} owe
                      {targetUser === viewingUser ? "" : "s"}
                    </p>
                    <p
                      className={`font-weight-light ${
                        userBalance < 0 ? "price-lose" : "price-zero"
                      }`}
                    >
                      ${userBalance < 0 ? formatBalance(userBalance) : "0.00"}
                    </p>
                  </div>
                </td>
                <td scope="col">
                  <div className="flex-grow-1">
                    <p className="mb-1 font-weight-light">
                      {getDisplayName(targetUser)}{" "}
                      {targetUser === viewingUser ? "are" : "is"} owed
                    </p>
                    <p
                      className={`font-weight-light ${
                        userBalance > 0 ? "price" : "price-zero"
                      }`}
                    >
                      ${userBalance > 0 ? formatBalance(userBalance) : "0.00"}
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {showGroupSummary && (
        <div className="group-balances">
          <h5 className="right-title">GROUP BALANCES</h5>
          <ul className="list-group list-group-flush text-start">
            {allBalances.map((memberBalance) => (
              <li className="right-part-member" key={memberBalance.userId}>
                <div className="image">
                  <img
                    className="rounded-circle"
                    src={`https://s3.amazonaws.com/splitwise/uploads/user/default_avatars/avatar-grey${
                      (groupMembers.indexOf(memberBalance.userId) % 6) + 1
                    }-100px.png`}
                    alt={memberBalance.userId}
                  />
                </div>
                <div className="member-data">
                  <p>{getDisplayName(memberBalance.userId)}</p>
                  {memberBalance.balance > 0 ? (
                    <div className="text-success">
                      gets back ${formatBalance(memberBalance.balance)}
                    </div>
                  ) : memberBalance.balance < 0 ? (
                    <div className="text-danger">
                      owes ${formatBalance(memberBalance.balance)}
                    </div>
                  ) : (
                    <span className="h5 price-zero">$0.00</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
