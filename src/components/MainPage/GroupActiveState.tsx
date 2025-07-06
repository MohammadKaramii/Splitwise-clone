import { useMemo, useEffect } from "react";
import { useAuth, useGroups, useExpenses } from "../../hooks";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { ListGroupCard } from "./ListGroupCard";
import { uid } from "uid";

export const GroupActiveState = () => {
  const { user } = useAuth();
  const { getCurrentGroup } = useGroups();
  const { fetchExpenses, getCurrentGroupExpenses } = useExpenses();
  const payments = useSelector((state: RootState) => state.payments.items);

  const activeGroup = getCurrentGroup();
  const expenses = getCurrentGroupExpenses();

  useEffect(() => {
    if (user?.id) {
      fetchExpenses();
    }
  }, [fetchExpenses, user?.id, user?.activeGroup]);

  const totalAmount = useMemo(() => {
    if (!activeGroup || !expenses) return 0;
    return expenses.reduce((sum, expense) => sum + expense.cost, 0);
  }, [activeGroup, expenses]);

  const groupPayments = useMemo(() => {
    if (!activeGroup || !payments) return [];
    return payments.filter((payment) => payment.groupId === activeGroup.id);
  }, [activeGroup, payments]);

  if (!user?.activeGroup || !activeGroup) return null;

  return (
    <div className="container d-flex flex-column">
      <ul className="list-group mt-2 mx-2">
        {expenses?.map((data) => (
          <li key={data.id} className="list-group-item message-container">
            <ListGroupCard
              data={data}
              members={data.sharedWith}
              totalAmount={totalAmount}
            />
          </li>
        ))}
      </ul>

      {groupPayments.length > 0 && (
        <ul className="paid-list">
          <h5>Transactions</h5>
          {groupPayments.map((payment) => (
            <li className="paid-person-container" key={payment.id || uid()}>
              <i className="fa-regular fa-circle-check mx-1"></i>
              <span>
                <strong>{payment.whoPaid}</strong>
              </span>
              <span> paid his share of </span>
              <strong>${payment.howMuchPaid}</strong>
              <span> to </span>
              <strong>{payment.toWho}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
