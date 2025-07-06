import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { useState, useMemo, useCallback, memo, useEffect } from "react";
import toast from "react-hot-toast";
import { supabase } from "../../../supabase";
import { addPayment } from "../../redux/slices/paymentsSlice";
import { Loading } from "../Loading";
import {
  calculatePairwiseBalance,
  calculateAllPairwiseBalances,
  Expense,
  PairwiseBalance,
  getSettlementSuggestions,
  getGroupPayments,
} from "../../utils/balanceCalculations";
import { GroupBalanceDetails } from "./GroupBalanceDetails";
import { useAuth, useGroups, useExpenses } from "../../hooks";

interface PaymentItem {
  whoPaid: string;
  howMuchPaid: number;
  toWho: string;
  groupName?: string;
  groupId?: string;
  id?: string;
}

function InfoOwesComponent() {
  const { user } = useAuth();
  const { groups } = useGroups();
  const { getCurrentGroupExpenses, fetchExpenses, expenses } = useExpenses();
  const activeGroupName = user?.activeGroup;
  const activeFriend = user?.activeFriend;

  const activeGroup = useMemo(
    () => groups.find((group) => group.groupName === activeGroupName),
    [groups, activeGroupName]
  );

  const sharedGroupsWithFriend = useMemo(() => {
    if (!activeFriend) return [];
    return groups.filter((group) => group.friends.includes(activeFriend));
  }, [groups, activeFriend]);

  const friends = activeGroup ? activeGroup.friends : [];

  const dispatch = useDispatch();
  const [settleModal, setSettleModal] = useState(false);
  const [settleAllModal, setSettleAllModal] = useState(false);
  const [howMuchSettle, setHowMuchSettle] = useState(0);
  const [settleAmount, setSettleAmount] = useState(0);
  const [selectedFriend, setSelectedFriend] = useState("");
  const [friend, setFriend] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const paids = useSelector(
    (state: RootState) => state.payments.items
  ) as PaymentItem[];

  useEffect(() => {
    if (activeFriend && user?.id) {
      fetchExpenses();
    }
  }, [activeFriend, user?.id, fetchExpenses]);

  useEffect(() => {
    if (user?.id) {
      fetchExpenses();
    }
  }, [user?.id, fetchExpenses]);

  const currentGroupExpenses = getCurrentGroupExpenses();

  const groupExpenses: Expense[] = useMemo(() => {
    if (!currentGroupExpenses) return [];
    return currentGroupExpenses.map((expense) => ({
      cost: expense.cost,
      whoPaid: expense.whoPaid,
      sharedWith: expense.sharedWith as string[],
    }));
  }, [currentGroupExpenses]);

  const friendTotalBalance = useMemo(() => {
    if (!activeFriend || !user?.name) return 0;

    let totalBalance = 0;

    sharedGroupsWithFriend.forEach((group) => {
      const groupExpenses = expenses
        .filter((expense) => expense.groupId === group.id)
        .map((expense) => ({
          cost: expense.cost,
          whoPaid: expense.whoPaid,
          sharedWith: expense.sharedWith as string[],
        }));

      const groupPayments = paids
        .filter((payment) => payment.groupId === group.id)
        .map((payment) => ({
          whoPaid: payment.whoPaid,
          howMuchPaid: payment.howMuchPaid,
          toWho: payment.toWho,
          groupId: payment.groupId,
        }));

      const groupBalance = calculatePairwiseBalance(
        user.name,
        activeFriend,
        groupExpenses,
        groupPayments
      );

      totalBalance += groupBalance;
    });

    return Number(totalBalance.toFixed(2));
  }, [activeFriend, user?.name, sharedGroupsWithFriend, expenses, paids]);

  const groupPayments = useMemo(() => {
    if (!activeGroup) return [];
    return getGroupPayments(paids || [], activeGroup).map((payment) => ({
      id: payment.id || `${payment.whoPaid}-${payment.toWho}-${Date.now()}`,
      from: payment.whoPaid,
      to: payment.toWho,
      amount: payment.howMuchPaid,
      groupId: payment.groupId || "",
      createdAt: new Date(),
    }));
  }, [paids, activeGroup]);

  const allPayments = useMemo(() => {
    return (paids || []).map((payment) => ({
      id: payment.id || `${payment.whoPaid}-${payment.toWho}-${Date.now()}`,
      from: payment.whoPaid,
      to: payment.toWho,
      amount: payment.howMuchPaid,
      groupId: payment.groupId || "",
      createdAt: new Date(),
    }));
  }, [paids]);

  const allGroupMembers = useMemo(() => {
    return activeGroup
      ? [user?.name || "", ...activeGroup.friends]
      : [user?.name || ""];
  }, [activeGroup, user?.name]);

  const originalGroupPayments = useMemo(() => {
    if (!activeGroup) return [];
    return getGroupPayments(paids || [], activeGroup);
  }, [paids, activeGroup]);

  const calculatePairwiseDebt = useCallback(
    (userA: string, userB: string) => {
      return calculatePairwiseBalance(
        userA,
        userB,
        groupExpenses,
        originalGroupPayments
      );
    },
    [groupExpenses, originalGroupPayments]
  );

  const refreshData = useCallback(async () => {
    try {
      await fetchExpenses();
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  }, [fetchExpenses]);

  const handleDirectSettle = useCallback(
    async (debtor: string, creditor: string, specificGroupId?: string) => {
      if (!user?.id) {
        toast.error("User not found");
        return;
      }

      setIsLoading(true);

      try {
        let debtAmount = 0;
        let targetGroupId = "";

        if (specificGroupId) {
          const group = sharedGroupsWithFriend.find(
            (g) => g.id === specificGroupId
          );
          if (!group) {
            toast.error("Group not found");
            setIsLoading(false);
            return;
          }

          const groupExpensesForCalc = expenses
            .filter((expense) => expense.groupId === group.id)
            .map((expense) => ({
              cost: expense.cost,
              whoPaid: expense.whoPaid,
              sharedWith: expense.sharedWith as string[],
            }));

          const groupPaymentsForCalc = paids
            .filter((payment) => payment.groupId === group.id)
            .map((payment) => ({
              whoPaid: payment.whoPaid,
              howMuchPaid: payment.howMuchPaid,
              toWho: payment.toWho,
              groupId: payment.groupId,
            }));

          debtAmount = Math.abs(
            calculatePairwiseBalance(
              debtor,
              creditor,
              groupExpensesForCalc,
              groupPaymentsForCalc
            )
          );
          targetGroupId = group.id;
        } else {
          debtAmount = Math.abs(friendTotalBalance);
          targetGroupId = sharedGroupsWithFriend[0]?.id || "";
        }

        if (debtAmount < 0.01) {
          toast.error("No debt to settle between these users");
          setIsLoading(false);
          return;
        }

        const newPayment: PaymentItem = {
          whoPaid: debtor,
          howMuchPaid: debtAmount,
          toWho: creditor,
          groupName:
            sharedGroupsWithFriend.find((g) => g.id === targetGroupId)
              ?.groupName || "",
          groupId: targetGroupId,
        };

        const updatedPaids = (prevPaids: PaymentItem[]) => {
          if (prevPaids.length === 0) {
            return [...prevPaids, newPayment];
          } else {
            const existingPaidIndex = prevPaids.findIndex(
              (paid) =>
                paid.whoPaid === newPayment.whoPaid &&
                paid.toWho === newPayment.toWho &&
                paid.groupId === newPayment.groupId
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
          toast.error(`Error updating data: ${error.message}`);
        } else {
          dispatch(addPayment(newPayment));
          toast.success(`Settlement recorded successfully!`, {
            duration: 4000,
          });

          await refreshData();
        }
      } catch (error) {
        console.error("Settlement error:", error);
        toast.error(`Settlement failed: ${error}`);
      }

      setIsLoading(false);
    },
    [
      user?.id,
      sharedGroupsWithFriend,
      expenses,
      paids,
      friendTotalBalance,
      dispatch,
      refreshData,
    ]
  );

  const handleSettleClick = useCallback(
    async (debtor: string, creditor: string, specificGroupId?: string) => {
      if (activeFriend) {
        await handleDirectSettle(debtor, creditor, specificGroupId);
        return;
      }

      setSelectedFriend(creditor);
      setFriend(debtor);

      const debt = calculatePairwiseDebt(debtor, creditor);

      if (Math.abs(debt) > 0.01) {
        setSettleModal(true);
        setHowMuchSettle(Math.abs(debt));
        setSettleAmount(Math.abs(debt));
      } else {
        toast.error("No debt to settle between these users");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [calculatePairwiseDebt, activeFriend]
  );

  const handleSettleUp = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);

      if (settleAmount === 0 || Number.isNaN(settleAmount)) {
        toast.error("Please enter current amount to settle");
        setIsLoading(false);
        return;
      }

      if (!user?.id) {
        toast.error("User not found");
        setIsLoading(false);
        return;
      }

      const newPayment: PaymentItem = {
        whoPaid: friend,
        howMuchPaid: settleAmount,
        toWho: selectedFriend,
        groupName: activeGroupName,
        groupId: activeGroup?.id || "",
      };

      const updatedPaids = (prevPaids: PaymentItem[]) => {
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

      try {
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
          toast.error(`Error updating data: ${error.message}`);
        } else {
          dispatch(addPayment(newPayment));
          toast.success(`Settlement recorded successfully!`, {
            duration: 4000,
          });

          // Refresh data to update all balance calculations
          await refreshData();
        }
      } catch (error) {
        console.error("Settlement error:", error);
        toast.error(`Settlement failed: ${error}`);
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
      user?.id,
      dispatch,
      activeGroup?.id,
      refreshData,
    ]
  );

  const handleSettleAll = useCallback(async () => {
    if (!activeGroupName || !user?.id) {
      toast.error("No active group selected or user not found");
      return;
    }

    setIsLoading(true);

    try {
      // Get settlement suggestions for the current group
      const settlements = getSettlementSuggestions(
        allGroupMembers,
        groupExpenses,
        originalGroupPayments
      );

      if (settlements.length === 0) {
        toast.success("Everyone is already settled up!");
        setIsLoading(false);
        return;
      }

      // Create new payments for all settlements
      const newPayments: PaymentItem[] = settlements.map((settlement) => ({
        whoPaid: settlement.from,
        howMuchPaid: settlement.amount,
        toWho: settlement.to,
        groupName: activeGroupName,
        groupId: activeGroup?.id || "",
      }));

      const updatedPaids = (prevPaids: PaymentItem[]) => {
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
        toast.error(`Error updating data: ${error.message}`);
      } else {
        newPayments.forEach((payment) => dispatch(addPayment(payment)));
        toast.success(
          `Successfully settled ${settlements.length} payment(s)! Everyone is now settled up.`,
          {
            duration: 5000,
          }
        );

        // Refresh data to update all balance calculations
        await refreshData();
      }
    } catch (error) {
      console.error("Settle all error:", error);
      toast.error(`Settle all failed: ${error}`);
    }

    setSettleAllModal(false);
    setIsLoading(false);
  }, [
    allGroupMembers,
    groupExpenses,
    originalGroupPayments,
    activeGroupName,
    paids,
    user?.id,
    dispatch,
    activeGroup?.id,
    refreshData,
  ]);

  if (!user) return null;

  return (
    <>
      {isLoading && <Loading />}

      {/* Show friend balance when friend is active */}
      {activeFriend && (
        <div className="col mt-3">
          <div className="group-balance-details">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="right-title">FRIEND BALANCE</h5>
            </div>

            <div className="friend-balance-summary">
              {Math.abs(friendTotalBalance) > 0.01 ? (
                <div
                  className="pairwise-balance-item"
                  style={{
                    padding: "15px",
                    margin: "5px 0",
                    border: "2px solid #ddd",
                    borderRadius: "8px",
                    backgroundColor: "#f8f9fa",
                  }}
                >
                  <div className="balance-description mb-3">
                    {friendTotalBalance > 0 ? (
                      <span>
                        <strong>You</strong> owe <strong>{activeFriend}</strong>{" "}
                        <span className="text-danger">
                          ${Math.abs(friendTotalBalance).toFixed(2)}
                        </span>
                      </span>
                    ) : (
                      <span>
                        <strong>{activeFriend}</strong> owes{" "}
                        <strong>you</strong>{" "}
                        <span className="text-success">
                          ${Math.abs(friendTotalBalance).toFixed(2)}
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="text-muted small mb-2">
                    Total across {sharedGroupsWithFriend.length} shared group
                    {sharedGroupsWithFriend.length !== 1 ? "s" : ""}
                  </div>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => {
                      const creditor =
                        friendTotalBalance > 0 ? activeFriend : user.name;
                      const debtor =
                        friendTotalBalance > 0 ? user.name : activeFriend;
                      // Don't pass group ID for total balance settlement
                      handleSettleClick(debtor, creditor);
                    }}
                  >
                    Settle up
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="mb-3">
                    <i
                      className="fa fa-check-circle text-success"
                      style={{ fontSize: "2rem" }}
                    ></i>
                  </div>
                  <span className="text-muted">
                    You and {activeFriend} are settled up across all groups
                  </span>
                </div>
              )}
            </div>

            {/* Show breakdown by groups */}
            {sharedGroupsWithFriend.length > 1 && (
              <div className="mt-4">
                <h6>Breakdown by Group:</h6>
                <div className="group-breakdown">
                  {sharedGroupsWithFriend.map((group) => {
                    // Calculate balance for this specific group
                    const groupExpensesForCalc = expenses
                      .filter((expense) => expense.groupId === group.id)
                      .map((expense) => ({
                        cost: expense.cost,
                        whoPaid: expense.whoPaid,
                        sharedWith: expense.sharedWith as string[],
                      }));

                    const groupPaymentsForCalc = paids
                      .filter((payment) => payment.groupId === group.id)
                      .map((payment) => ({
                        whoPaid: payment.whoPaid,
                        howMuchPaid: payment.howMuchPaid,
                        toWho: payment.toWho,
                        groupId: payment.groupId,
                      }));

                    const groupBalance = calculatePairwiseBalance(
                      user.name,
                      activeFriend,
                      groupExpensesForCalc,
                      groupPaymentsForCalc
                    );

                    if (Math.abs(groupBalance) < 0.01) return null;

                    return (
                      <div
                        key={group.id}
                        className="group-balance-item d-flex justify-content-between align-items-center py-2 px-3 mb-1"
                        style={{
                          backgroundColor: "#f8f9fa",
                          borderRadius: "4px",
                          border: "1px solid #dee2e6",
                        }}
                      >
                        <span className="group-name">{group.groupName}</span>
                        <span
                          className={
                            groupBalance > 0 ? "text-danger" : "text-success"
                          }
                        >
                          {groupBalance > 0
                            ? `You owe $${Math.abs(groupBalance).toFixed(2)}`
                            : `${activeFriend} owes $${Math.abs(
                                groupBalance
                              ).toFixed(2)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Show all settlement suggestions across shared groups */}
            <div className="mt-4">
              <h6>All Settlement Suggestions:</h6>
              <div className="all-settlements">
                {sharedGroupsWithFriend.map((group) => {
                  // Get all members of this group
                  const groupMembers = [user?.name || "", ...group.friends];

                  // Get expenses for this group
                  const groupExpensesForCalc = expenses
                    .filter((expense) => expense.groupId === group.id)
                    .map((expense) => ({
                      cost: expense.cost,
                      whoPaid: expense.whoPaid,
                      sharedWith: expense.sharedWith as string[],
                    }));

                  // Get payments for this group
                  const groupPaymentsForCalc = paids
                    .filter((payment) => payment.groupId === group.id)
                    .map((payment) => ({
                      whoPaid: payment.whoPaid,
                      howMuchPaid: payment.howMuchPaid,
                      toWho: payment.toWho,
                      groupId: payment.groupId,
                    }));

                  // Calculate all pairwise balances for this group
                  const pairwiseBalances = calculateAllPairwiseBalances(
                    groupMembers,
                    groupExpensesForCalc,
                    groupPaymentsForCalc
                  );

                  // Filter to show only non-zero balances
                  const activeBalances = pairwiseBalances.filter(
                    (pair: PairwiseBalance) => Math.abs(pair.amount) > 0.01
                  );

                  if (activeBalances.length === 0) return null;

                  return (
                    <div key={group.id} className="group-settlements mb-3">
                      <div className="group-header mb-2">
                        <strong>{group.groupName}</strong>
                      </div>
                      {activeBalances.map(
                        (pair: PairwiseBalance, index: number) => (
                          <div
                            key={index}
                            className="settlement-item d-flex justify-content-between align-items-center py-2 px-3 mb-1"
                            style={{
                              backgroundColor: "#f8f9fa",
                              borderRadius: "4px",
                              border: "1px solid #dee2e6",
                            }}
                          >
                            <div className="settlement-description">
                              {pair.amount > 0 ? (
                                <span>
                                  <strong>
                                    {pair.userA === user?.name
                                      ? "You"
                                      : pair.userA}
                                  </strong>{" "}
                                  owes{" "}
                                  <strong>
                                    {pair.userB === user?.name
                                      ? "You"
                                      : pair.userB}
                                  </strong>{" "}
                                  <span className="text-danger">
                                    ${Math.abs(pair.amount).toFixed(2)}
                                  </span>
                                </span>
                              ) : (
                                <span>
                                  <strong>
                                    {pair.userB === user?.name
                                      ? "You"
                                      : pair.userB}
                                  </strong>{" "}
                                  owes{" "}
                                  <strong>
                                    {pair.userA === user?.name
                                      ? "You"
                                      : pair.userA}
                                  </strong>{" "}
                                  <span className="text-danger">
                                    ${Math.abs(pair.amount).toFixed(2)}
                                  </span>
                                </span>
                              )}
                            </div>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => {
                                const creditor =
                                  pair.amount > 0 ? pair.userB : pair.userA;
                                const debtor =
                                  pair.amount > 0 ? pair.userA : pair.userB;
                                handleSettleClick(debtor, creditor, group.id);
                              }}
                            >
                              Settle
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show group balance when group is active (existing functionality) */}
      {user.activeGroup && !activeFriend && friends.length > 0 && (
        <div className="col mt-3">
          {/* Use new GroupBalanceDetails for proper pairwise relationships */}
          <GroupBalanceDetails
            groupMembers={allGroupMembers}
            expenses={groupExpenses}
            payments={groupPayments}
            viewingUser={user.name}
            allGroups={groups}
            allPayments={allPayments}
            onSettleClick={handleSettleClick}
            onSettleAllClick={() => setSettleAllModal(true)}
          />
        </div>
      )}

      {settleModal && !activeFriend && (
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

      {settleAllModal && !activeFriend && (
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
    </>
  );
}

export const InfoOwes = memo(InfoOwesComponent);
