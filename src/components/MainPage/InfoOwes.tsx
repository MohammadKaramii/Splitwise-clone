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
  getSettlementSuggestions,
  getGroupPayments,
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
  const [settleAllModal, setSettleAllModal] = useState(false);
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

  // Filter payments for current group
  const groupPayments = useMemo(() => {
    if (!activeGroup) return [];
    return getGroupPayments(paids || [], activeGroup);
  }, [paids, activeGroup]);

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
        setSettleAmount(Math.abs(debt)); // Pre-fill with the full debt amount
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
        whoPaid: friend, // The debtor pays
        howMuchPaid: settleAmount,
        toWho: selectedFriend, // The creditor receives
        groupName: activeGroupName,
        groupId: activeGroup?.id || "",
      };

      const updatedPaids = (prevPaids: Paid[]) => {
        if (prevPaids.length === 0) {
          return [...prevPaids, newPayment];
        } else {
          const existingPaidIndex = prevPaids.findIndex(
            (paid) =>
              paid.whoPaid === newPayment.whoPaid &&
              paid.toWho === newPayment.toWho &&
              (paid.groupId
                ? paid.groupId === newPayment.groupId
                : paid.groupName === newPayment.groupName)
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

  const handleSettleAll = useCallback(async () => {
    if (!activeGroupName) {
      toast.error("No active group selected");
      return;
    }

    setIsLoading(true);

    // Get settlement suggestions for the current group
    const settlements = getSettlementSuggestions(
      allGroupMembers,
      expenses,
      groupPayments
    );

    if (settlements.length === 0) {
      toast.success("Everyone is already settled up!");
      setIsLoading(false);
      return;
    }

    // Create new payments for all settlements
    const newPayments = settlements.map((settlement) => ({
      whoPaid: settlement.from,
      howMuchPaid: settlement.amount,
      toWho: settlement.to,
      groupName: activeGroupName,
      groupId: activeGroup?.id || "",
    }));

    const updatedPaids = (prevPaids: Paid[]) => {
      let result = [...prevPaids];

      // Add each new payment, consolidating with existing ones if they exist
      newPayments.forEach((newPayment) => {
        const existingPaidIndex = result.findIndex(
          (paid) =>
            paid.whoPaid === newPayment.whoPaid &&
            paid.toWho === newPayment.toWho &&
            (paid.groupId
              ? paid.groupId === newPayment.groupId
              : paid.groupName === newPayment.groupName)
        );

        if (existingPaidIndex !== -1) {
          result = result.map((paid, index) => {
            if (index === existingPaidIndex) {
              return {
                ...paid,
                howMuchPaid: paid.howMuchPaid + newPayment.howMuchPaid,
              };
            }
            return paid;
          });
        } else {
          result.push(newPayment);
        }
      });

      return result;
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
      toast.success(
        `Successfully settled ${settlements.length} payment(s)! Everyone is now settled up.`,
        {
          duration: 5000,
        }
      );
    }

    setSettleAllModal(false);
    setIsLoading(false);
  }, [
    allGroupMembers,
    expenses,
    groupPayments,
    activeGroupName,
    paids,
    user.id,
    dispatch,
  ]);

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
            allPayments={allPayments}
            onSettleClick={handleSettleClick}
            onSettleAllClick={() => setSettleAllModal(true)}
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
                    onClick={() => {
                      setSettleModal(false);
                      setSettleAmount(0);
                    }}
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

      {settleAllModal && (
        <div className="modal d-flex">
          <div className="modal-dialog">
            <div className="modal-content settleup-modal">
              <div className="modal-header">
                <h5 className="modal-title">Settle All Debts</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setSettleAllModal(false)}
                />
              </div>
              <div className="modal-body">
                <p>
                  This will automatically settle all outstanding debts in the
                  group using the minimum number of transactions.
                </p>
                <p>
                  <strong>Are you sure you want to settle all debts?</strong>
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  onClick={() => setSettleAllModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSettleAll}
                >
                  Settle All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {user.activeFriend && (
        <div className="col mt-3">
          <div className="group-balance-details">
            <div className="current-group-balances">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="right-title">
                  {user.activeFriend} OWES (Current Group)
                </h5>
              </div>
              <div className="pairwise-balances">
                {(() => {
                  // Get all people who have relationships with the active friend in CURRENT GROUP ONLY
                  const currentGroupPeopleSet = new Set<string>();

                  // Add people from expenses involving the active friend in current group only
                  expenses.forEach((expense) => {
                    if (
                      expense.whoPaid === user.activeFriend ||
                      expense.sharedWith.includes(user.activeFriend!)
                    ) {
                      currentGroupPeopleSet.add(expense.whoPaid);
                      expense.sharedWith.forEach((person) =>
                        currentGroupPeopleSet.add(person)
                      );
                    }
                  });

                  // Add people from payments involving the active friend in current group only
                  groupPayments.forEach((payment) => {
                    if (
                      payment.whoPaid === user.activeFriend ||
                      payment.toWho === user.activeFriend
                    ) {
                      currentGroupPeopleSet.add(payment.whoPaid);
                      currentGroupPeopleSet.add(payment.toWho);
                    }
                  });

                  const currentGroupPeople = Array.from(currentGroupPeopleSet);

                  // Calculate pairwise balances only showing what the active friend owes in current group
                  const relevantBalances = currentGroupPeople
                    .filter((person) => person !== user.activeFriend)
                    .map((person) => {
                      const balance = calculatePairwiseBalance(
                        user.activeFriend!,
                        person,
                        expenses,
                        groupPayments
                      );
                      return {
                        userA: user.activeFriend!,
                        userB: person,
                        amount: balance,
                      };
                    })
                    .filter((pair) => pair.amount > 0.01); // Only show positive amounts (active friend owes others)

                  const getDisplayName = (userName: string) => {
                    return userName === user.name ? "You" : userName;
                  };

                  const formatBalance = (balance: number) => {
                    return Math.abs(balance).toFixed(2);
                  };

                  return relevantBalances.length > 0 ? (
                    relevantBalances.map((pair, index) => (
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
                          <span>
                            <strong>{getDisplayName(pair.userA)}</strong> owes{" "}
                            <strong>{getDisplayName(pair.userB)}</strong>{" "}
                            <span className="text-danger">
                              ${formatBalance(pair.amount)}
                            </span>
                          </span>
                        </div>
                        <button
                          className="btn btn-sm btn-outline-primary mt-2"
                          onClick={() => {
                            // Active friend (userA) always owes to userB in this view
                            handleSettleClick(pair.userA, pair.userB);
                          }}
                        >
                          Settle up
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3">
                      <span className="text-muted">
                        {user.activeFriend} doesn't owe money to anyone
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const InfoOwes = memo(InfoOwesComponent);
