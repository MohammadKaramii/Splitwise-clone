import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { useState, useMemo, useCallback, memo } from "react";
import toast from "react-hot-toast";
import { supabase } from "../../../supabase";
import { setAddPayment } from "../../redux/reducers/paidSlice";
import { Paid } from "../../types";
import { Loading } from "../Loading";
import {
  calculatePairwiseBalance,
  Expense,
} from "../../utils/balanceCalculations";
import { GroupBalanceDetails } from "./GroupBalanceDetails";

function InfoOwesComponent() {
  const groups = useSelector((state: RootState) => state.groups.groups);
  const user = useSelector((state: RootState) => state.userData.user);
  const activeGroupName = user.activeGroup;
  const activeGroup = useMemo(
    () => groups.find((group) => group.groupName === activeGroupName),
    [groups, activeGroupName]
  );

  const friends = activeGroup ? activeGroup.friends : [];

  const dispatch = useDispatch();
  const [settleModal, setSettleModal] = useState(false);
  const [howMuchSettle, setHowMuchSettle] = useState(0);
  const [settleAmount, setSettleAmount] = useState(0);
  const [selectedFriend, setSelectedFriend] = useState("");
  const [friend, setFriend] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const paids = useSelector((state: RootState) => state.paids);
  const spents = useSelector((state: RootState) => state.spents);

  // Convert expenses to the format expected by balance calculations (current group)
  const expenses: Expense[] = useMemo(() => {
    if (!spents) return [];
    return spents.map((spent) => ({
      cost: spent.cost,
      whoPaid: spent.whoPaid,
      sharedWith: spent.sharedWith as string[],
    }));
  }, [spents]);

  // Get all expenses across all groups for comprehensive summary
  const allExpenses: Expense[] = useMemo(() => {
    if (!groups) return [];
    return groups.flatMap((group) =>
      (group.howSpent || []).map((spent) => ({
        cost: spent.cost,
        whoPaid: spent.whoPaid,
        sharedWith: spent.sharedWith as string[],
      }))
    );
  }, [groups]);

  // Filter payments for current group
  const groupPayments = useMemo(() => {
    return paids?.filter((paid) => paid.groupName === activeGroupName) || [];
  }, [paids, activeGroupName]);

  // All payments across all groups
  const allPayments = useMemo(() => {
    return paids || [];
  }, [paids]);

  // Get all group members including the current user
  const allGroupMembers = useMemo(() => {
    return activeGroup ? [user.name, ...activeGroup.friends] : [user.name];
  }, [activeGroup, user.name]);

  /**
   * Calculate how much one user owes another
   * Positive = userA owes userB, Negative = userB owes userA
   */
  const calculatePairwiseDebt = useCallback(
    (userA: string, userB: string) => {
      return calculatePairwiseBalance(userA, userB, expenses, groupPayments);
    },
    [expenses, groupPayments]
  );

  const handleSettleClick = useCallback(
    (debtor: string, creditor: string) => {
      setSelectedFriend(creditor);
      setFriend(debtor);
      const debt = calculatePairwiseDebt(debtor, creditor);

      if (Math.abs(debt) > 0.01) {
        setSettleModal(true);
        setHowMuchSettle(Math.abs(debt));
      } else {
        toast.error("No debt to settle between these users");
      }
    },
    [calculatePairwiseDebt]
  );

  const handleSettleUp = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);

      if (settleAmount === 0 || Number.isNaN(settleAmount)) {
        toast.error("Please enter current amount to settle");
        return;
      }
      const newPayment = {
        whoPaid: selectedFriend,
        howMuchPaid: settleAmount,
        toWho: friend,
        groupName: activeGroupName,
      };

      const updatedPaids = (prevPaids: Paid[]) => {
        if (prevPaids.length === 0) {
          return [...prevPaids, newPayment];
        } else {
          const existingPaidIndex = prevPaids.findIndex(
            (paid) =>
              paid.whoPaid === newPayment.whoPaid &&
              paid.toWho === newPayment.toWho &&
              paid.groupName === newPayment.groupName
          );

          if (existingPaidIndex !== -1) {
            return prevPaids?.map((paid, index) => {
              if (index === existingPaidIndex) {
                return {
                  ...paid,
                  howMuchPaid: paid.howMuchPaid + newPayment.howMuchPaid,
                };
              }
              return paid;
            });
          } else {
            return [...prevPaids, newPayment];
          }
        }
      };

      const { error } =
        paids.length === 0
          ? await supabase.from("myPaids").insert({
              paids: updatedPaids(paids),
              userId: user.id,
            })
          : await supabase
              .from("myPaids")
              .update({
                paids: updatedPaids(paids),
              })
              .eq("userId", user.id);

      if (error) {
        toast.error(`Error updating data: ${error}`);
      } else {
        dispatch(setAddPayment(updatedPaids(paids)));
        toast.success(`Data updated successfully!`, {
          duration: 4000,
        });
      }

      setSettleModal(false);
      setSettleAmount(0);
      setIsLoading(false);
    },
    [
      activeGroupName,
      selectedFriend,
      settleAmount,
      friend,
      paids,
      user.id,
      dispatch,
    ]
  );

  return (
    <>
      {isLoading && <Loading />}
      {user.activeGroup && friends.length > 0 && (
        <div className="col mt-3">
          {/* Use new GroupBalanceDetails for proper pairwise relationships */}
          <GroupBalanceDetails
            groupMembers={allGroupMembers}
            expenses={expenses}
            payments={groupPayments}
            viewingUser={user.name}
            allGroups={groups}
            allExpenses={allExpenses}
            allPayments={allPayments}
            onSettleClick={handleSettleClick}
          />
        </div>
      )}
      {settleModal && (
        <form onSubmit={handleSettleUp}>
          <div className="modal d-flex">
            <div className="modal-dialog">
              <div className="modal-content settleup-modal">
                <div className="modal-header">
                  <h5 className="modal-title">Settle Up</h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setSettleModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <p>Enter the amount to settle (Max: ${howMuchSettle}):</p>
                  <input
                    type="number"
                    className="form-control"
                    value={settleAmount}
                    onChange={(e) =>
                      setSettleAmount(parseFloat(e.target.value))
                    }
                    max={howMuchSettle}
                  />
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-secondary">
                    Settle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {user.activeFriend && (
        <div className="col mt-3">
          <GroupBalanceDetails
            groupMembers={[user.name, user.activeFriend]}
            expenses={allExpenses.filter(
              (expense) =>
                expense.sharedWith.includes(user.name) ||
                expense.sharedWith.includes(user.activeFriend!) ||
                expense.whoPaid === user.name ||
                expense.whoPaid === user.activeFriend!
            )}
            payments={allPayments.filter(
              (payment) =>
                (payment.whoPaid === user.name &&
                  payment.toWho === user.activeFriend!) ||
                (payment.whoPaid === user.activeFriend! &&
                  payment.toWho === user.name)
            )}
            viewingUser={user.name}
            allGroups={groups}
            allExpenses={allExpenses}
            allPayments={allPayments}
            onSettleClick={handleSettleClick}
          />
        </div>
      )}
    </>
  );
}

export const InfoOwes = memo(InfoOwesComponent);
