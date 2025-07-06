import { useMemo, useCallback } from "react";
import { useAuth, useGroups, useExpenses } from "../../hooks";
import { formatAmount, formatMonthDay } from "../../utils";
import { calculatePairwiseBalance } from "../../utils/balanceCalculations";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

export const FriendActiveState = () => {
  const { user } = useAuth();
  const { groups } = useGroups();
  const { expenses } = useExpenses();
  const paids = useSelector((state: RootState) => state.payments.items);

  const activeFriend = user?.activeFriend;

  const friendGroups = useMemo(() => {
    if (!activeFriend) return [];
    return groups.filter((group) => group.friends.includes(activeFriend));
  }, [groups, activeFriend]);

  const groupBalances = useMemo(() => {
    if (!activeFriend || !user?.name) return {};

    const balances: Record<string, number> = {};

    friendGroups.forEach((group) => {
      // Get expenses for this group
      const groupExpenses = expenses
        .filter((expense) => expense.groupId === group.id)
        .map((expense) => ({
          cost: expense.cost,
          whoPaid: expense.whoPaid,
          sharedWith: expense.sharedWith as string[],
        }));

      // Get payments for this group
      const groupPayments = paids
        .filter((payment) => payment.groupId === group.id)
        .map((payment) => ({
          whoPaid: payment.whoPaid,
          howMuchPaid: payment.howMuchPaid,
          toWho: payment.toWho,
          groupId: payment.groupId,
        }));

      // Calculate pairwise balance between current user and active friend
      const balance = calculatePairwiseBalance(
        user.name,
        activeFriend,
        groupExpenses,
        groupPayments
      );

      balances[group.groupName] = balance;
    });

    return balances;
  }, [friendGroups, activeFriend, user?.name, expenses, paids]);

  const allSettled = useMemo(() => {
    return Object.values(groupBalances).every(
      (balance) => Math.abs(balance) < 0.01
    );
  }, [groupBalances]);

  const getDebtDescription = useCallback(
    (balance: number, friendName: string) => {
      if (Math.abs(balance) < 0.01) {
        return `You and ${friendName} are settled up`;
      }
      return balance > 0 ? `You owe ${friendName}` : `${friendName} owes you`;
    },
    []
  );

  const handleTime = useCallback(
    (groupName: string) => {
      const group = groups.find((g) => g.groupName === groupName);
      const timeUpdate = group?.lastUpdate || new Date().toISOString();
      return formatMonthDay(timeUpdate);
    },
    [groups]
  );

  if (!activeFriend) return null;

  return (
    <div className="container">
      {!allSettled ? (
        <ul className="list-group mt-2 mx-2">
          {friendGroups.map((group) => {
            const balance = groupBalances[group.groupName] || 0;
            const { month, day } = handleTime(group.groupName);

            return (
              <li
                key={group.groupName}
                className="list-group-item message-container mt-1"
              >
                <div className="message-date group-name-date">
                  <div>
                    <p>{month}</p>
                    <p>{day}</p>
                  </div>
                  <div className="group-name-container">
                    <img
                      src="https://secure.splitwise.com/assets/fat_rabbit/group-icon.png"
                      alt="group-icon"
                    />
                    <h6>{group.groupName}</h6>
                  </div>
                </div>
                <div
                  className={`${
                    balance > 0
                      ? "spent-status-lose"
                      : balance < 0
                      ? "spent-status-recive"
                      : "price-lose"
                  }`}
                >
                  <div
                    className={`${
                      balance > 0
                        ? "you-lent"
                        : balance < 0
                        ? "lent-you"
                        : "price-zero"
                    }`}
                  >
                    <p>{getDebtDescription(balance, activeFriend)}</p>
                    <strong>${formatAmount(balance)}</strong>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="settle-point no-expenses">
          <img
            src="https://assets.splitwise.com/assets/fat_rabbit/app/checkmark-circle-ae319506ad7196dc77eede0aed720a682363d68160a6309f6ebe9ce1983e45f0.png"
            className="my-5 w-25"
            alt="checkmark-icon"
          />
          <p>You and {activeFriend} are all settled up.</p>
        </div>
      )}
    </div>
  );
};
