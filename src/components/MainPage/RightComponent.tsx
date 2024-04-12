import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { supabase } from "../../../supabase";
import { updateMessage } from "../../redux/reducers/dummyDataSlice";
import { setAddPayment } from "../../redux/reducers/paidSlice";
const RightComponent = () => {
  const groups = useSelector((state: RootState) => state.dummyData.groups);
  const user = useSelector((state: RootState) => state.userData.user);
  const activeGroupName = user.activeGroup;
  const activeGroup = useMemo(
    () => groups.find((group) => group.groupName === activeGroupName),
    [groups, activeGroupName]
  );

  const friends = activeGroup ? activeGroup.friends : [];
  const totalAmount = useSelector((state: RootState) => state.totalAmonut);
  const dispatch = useDispatch();
  const modalRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [settleModal, setSettleModal] = useState(false);
  const [howMuchSettle, setHowMuchSettle] = useState(0);
  const [settleAmount, setSettleAmount] = useState(0);
  const [selectedFriend, setSelectedFriend] = useState("");
  const [friend, setFriend] = useState("");
  const [paids, setPaids] = useState<any>(
    activeGroup?.paid ? activeGroup.paid : null
  );
  dispatch(setAddPayment(paids));

  const calculateTotalAmount = useCallback(
    (whoPaid: string) => {
      if (!activeGroup) {
        return 0;
      }
      const paidToCurrentUser = paids?.filter((paid) => paid.toWho === whoPaid);
      const currentUserPaid = paids?.filter((paid) => paid.whoPaid === whoPaid);

      let totalAmount = activeGroup.howSpent?.reduce((sum, item) => {
        const shouldIncludeUser =
          whoPaid === user.name && item.whoPaid !== user.name;
        const shareAmount = Number(
          (item.cost / (item.sharedWith.length + 1)).toFixed(2)
        );

        if (item.whoPaid === whoPaid) {
          return sum + (item.cost - shareAmount);
        }

        if (item.sharedWith.includes(whoPaid) || shouldIncludeUser) {
          return sum - shareAmount;
        }
        return sum;
      }, 0);

      if (paidToCurrentUser) {
        totalAmount -= paidToCurrentUser.reduce(
          (total, paid) => total + paid.howMuchPaid,
          0
        );
      }

      if (currentUserPaid) {
        totalAmount += currentUserPaid.reduce(
          (total, paid) => total + paid.howMuchPaid,
          0
        );
      }

      return totalAmount;
    },
    [activeGroup, paids, user.name]
  );

  const calculateTotalAmountFriend = useCallback(
    (friend: string) => {
      const currentHowSpents = activeGroup?.howSpent?.filter(
        (howSpent) =>
          (howSpent.sharedWith.includes(friend) &&
            howSpent.sharedWith.includes(selectedFriend)) ||
          friend === user.name ||
          selectedFriend === user.name
      );

      const totalAmounts = currentHowSpents?.reduce((sum, item) => {
        const shareAmount = item.cost / (item.sharedWith.length + 1);

        if (friend === selectedFriend) {
          return 0;
        }

        return item.whoPaid === friend
          ? sum - shareAmount
          : item.whoPaid === selectedFriend
          ? sum + shareAmount
          : sum;
      }, 0);

      const demands = paids
        ?.filter(
          (payment) =>
            payment.whoPaid === selectedFriend && payment.toWho === friend
        )
        .reduce((total, payment) => total + payment.howMuchPaid, 0);

      const debts = paids
        ?.filter(
          (payment) =>
            payment.whoPaid === friend && payment.toWho === selectedFriend
        )
        .reduce((total, payment) => total + payment.howMuchPaid, 0);

      return Number(totalAmounts + demands - debts).toFixed(2);
    },
    [activeGroup, selectedFriend, user.name, paids]
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef?.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addPaid = useCallback(
    (newPayment) => {
      if (paids.length === 0) {
        setPaids([...paids, newPayment]);
      } else {
        let foundMatch = false;
        const updatedPaid = paids.map((paid) => {
          if (
            paid.whoPaid === newPayment.whoPaid &&
            paid.toWho === newPayment.toWho
          ) {
            foundMatch = true;
            return {
              ...paid,
              howMuchPaid: paid.howMuchPaid + newPayment.howMuchPaid,
            };
          }
          return paid;
        });

        if (!foundMatch) {
          setPaids([...updatedPaid, newPayment]);
        } else {
          setPaids(updatedPaid);
        }
      }
    },
    [paids]
  );

  const handleSettleMessage = (member: string, selectedFriend: string) => {
    setFriend(member);
    if (Number(calculateTotalAmountFriend(member)) < 0) {
      setSettleModal(true);
      setHowMuchSettle(Math.abs(Number(calculateTotalAmountFriend(member))));
    } else if (Number(calculateTotalAmountFriend(member)) > 0) {
      toast.error(
        `${member === user.name ? "You" : member} owes ${
          selectedFriend === user.name ? "You" : selectedFriend
        }`
      );
    } else {
      toast.error(
        `${selectedFriend === user.name ? "You" : selectedFriend}  don't owe ${
          member === user.name ? "You" : member
        } anything`
      );
    }
  };

  const handleSettleUp = useCallback(
    async (e) => {
      e.preventDefault();
      const newPayment = {
        whoPaid: selectedFriend,
        howMuchPaid: settleAmount,
        toWho: friend,
      };

      addPaid(newPayment);

      const { error } = await supabase
        .from("groups")
        .update({
          paid: paids,
        })
        .eq("groupName", activeGroupName);

      if (error) {
        toast.error(`Error updating data: ${error}`);
      } else {
        toast.success(`Data updated successfully!`, {
          duration: 4000,
        });
      }

      const updatedGroups = groups.map((group) => {
        if (group.groupName === activeGroupName) {
          const updatedGroup = {
            ...group,
            paid: paids,
          };
          return updatedGroup;
        }
        return group;
      });

      dispatch(updateMessage(updatedGroups));

      setSettleModal(false);
      setSettleAmount(0);
      console.log(paids, 3);
    },
    [
      activeGroupName,
      addPaid,
      dispatch,
      friend,
      groups,
      paids,
      selectedFriend,
      settleAmount,
    ]
  );

  return (
    <>
      {user.activeGroup && friends.length > 0 && (
        <div className="col mt-3">
          <h5 className="right-title">GROUP BALANCES</h5>
          <ul className="list-group list-group-flush text-start">
            {friends.map((member, index) => (
              <li
                className={`right-part-member ${
                  selectedFriend === member && isOpen ? "active-member" : ""
                }`}
                key={member}
                onClick={() => {
                  setIsOpen(true);
                  setSelectedFriend(member);
                }}
              >
                <div className="image">
                  <img
                    className="rounded-circle"
                    src={`https://s3.amazonaws.com/splitwise/uploads/user/default_avatars/avatar-grey${
                      index + 1
                    }-100px.png`}
                    alt={member}
                  />
                </div>
                <div className="member-data">
                  <p>{member}</p>
                  {calculateTotalAmount(member) > 0 ? (
                    <div className="text-success">
                      gets back ${calculateTotalAmount(member)}
                    </div>
                  ) : calculateTotalAmount(member) < 0 ? (
                    <div className="text-danger">
                      owes ${Math.abs(calculateTotalAmount(member))}
                    </div>
                  ) : (
                    <span className="h5 price-zero">$0.00</span>
                  )}
                </div>
              </li>
            ))}
            <li
              className={`right-part-member ${
                selectedFriend === user.name && isOpen ? "active-member" : ""
              }`}
              onClick={() => {
                setIsOpen(true);
                setSelectedFriend(user.name);
              }}
            >
              <div className="image">
                <img
                  className="rounded-circle"
                  src="https://s3.amazonaws.com/splitwise/uploads/user/default_avatars/avatar-ruby38-50px.png"
                />
              </div>
              <div className="member-data">
                <p>You</p>
                {calculateTotalAmount(user.name) > 0 ? (
                  <div className="text-success">
                    gets back ${calculateTotalAmount(user.name)}
                  </div>
                ) : calculateTotalAmount(user.name) < 0 ? (
                  <div className="text-danger">
                    owes ${Math.abs(calculateTotalAmount(user.name))}
                  </div>
                ) : (
                  <span className="h6 price-zero">$0.00</span>
                )}
              </div>
            </li>
          </ul>
          {isOpen && (
            <>
              <div className="modal fade show d-block ">
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content" ref={modalRef}>
                    <div className="modal-header">
                      <h5 className="modal-title">
                        Suggested repayments for {activeGroupName}
                      </h5>
                      <i
                        className="fa fa-x text-danger btn border-0 icon-button"
                        onClick={() => setIsOpen(false)}
                      />
                    </div>
                    <div className="modal-body">
                      <ul className="list-group justify-content-between repayments">
                        {friends
                          .filter((member) => member !== selectedFriend)
                          .map((member) => (
                            <li
                              className={`list-group-item  justify-content-between ${
                                member === selectedFriend ? "d-none" : ""
                              }`}
                            >
                              <p className="lent-text">
                                {Number(calculateTotalAmountFriend(member)) <= 0
                                  ? selectedFriend === user.name
                                    ? "You"
                                    : selectedFriend
                                  : member}{" "}
                                <strong>
                                  owes{" "}
                                  <span
                                    className={` ${
                                      Number(
                                        calculateTotalAmountFriend(member)
                                      ) > 0
                                        ? "lent-you"
                                        : Number(
                                            calculateTotalAmountFriend(member)
                                          ) < 0
                                        ? "you-lent"
                                        : "price-zero"
                                    }`}
                                  >
                                    {Number(
                                      calculateTotalAmountFriend(member)
                                    ) === 0
                                      ? "nothing"
                                      : `$${Math.abs(
                                          Number(
                                            calculateTotalAmountFriend(member)
                                          )
                                        )}`}
                                  </span>
                                </strong>{" "}
                                to{" "}
                                <strong>
                                  {Number(calculateTotalAmountFriend(member)) >
                                  0
                                    ? selectedFriend === user.name
                                      ? "You"
                                      : selectedFriend
                                    : member}
                                </strong>
                              </p>
                              <button
                                className="btn btn-mint"
                                onClick={() =>
                                  handleSettleMessage(member, selectedFriend)
                                }
                              >
                                Settle up
                              </button>
                            </li>
                          ))}

                        {selectedFriend !== user.name && (
                          <li className="list-group-item justify-content-between">
                            <p className="lent-text">
                              {Number(calculateTotalAmountFriend(user.name)) <=
                              0
                                ? selectedFriend
                                : "You"}{" "}
                              <strong>
                                owes{" "}
                                <span
                                  className={` ${
                                    Number(
                                      calculateTotalAmountFriend(user.name)
                                    ) > 0
                                      ? "lent-you"
                                      : Number(
                                          calculateTotalAmountFriend(user.name)
                                        ) < 0
                                      ? "you-lent"
                                      : "price-zero"
                                  }`}
                                >
                                  {Number(
                                    calculateTotalAmountFriend(user.name)
                                  ) === 0
                                    ? "nothing"
                                    : `$${Math.abs(
                                        Number(
                                          calculateTotalAmountFriend(user.name)
                                        )
                                      )}`}
                                </span>
                              </strong>{" "}
                              to{" "}
                              <strong>
                                {Number(calculateTotalAmountFriend(user.name)) >
                                  0 && selectedFriend !== user.name
                                  ? selectedFriend
                                  : "You"}
                              </strong>
                            </p>
                            <button
                              className="btn btn-mint"
                              onClick={() =>
                                handleSettleMessage(user.name, selectedFriend)
                              }
                            >
                              Settle up
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      {settleModal && (
        <form onSubmit={handleSettleUp}>
          <div className="modal" style={{ display: "block" }}>
            <div className="modal-dialog">
              <div className="modal-content">
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
                    min={0}
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
        <div
          className={`right-component container mt-5 right-component-friend  ${
            totalAmount > 0
              ? "you-lent"
              : totalAmount < 0
              ? "lent-you "
              : "price-zero"
          }`}
        >
          <h5>YOUR BALANCE</h5>
          <h6>
            {totalAmount < 0
              ? `${user.activeFriend} owes You`
              : totalAmount > 0
              ? `You owes ${user.activeFriend}`
              : "You are all settled up"}
          </h6>
          <strong className={totalAmount === 0 ? "d-none" : "d-block"}>
            ${Math.abs(totalAmount)}
          </strong>
        </div>
      )}
    </>
  );
};

export default RightComponent;
