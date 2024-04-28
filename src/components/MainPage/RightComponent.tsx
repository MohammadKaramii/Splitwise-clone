import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { supabase } from "../../../supabase";
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
  // const [activeFriendPaids, setActiveFriendPaids] = useState([]);
  const paids = useSelector((state: RootState) => state.paids);
  const spents = useSelector((state: RootState) => state.spents);



  const calculateTotalAmount = useCallback(
    (whoPaid: string) => {
      if (!activeGroup) {
        return 0;
      }
      const paidToCurrentUser = paids?.filter(
        (paid) => paid.toWho === whoPaid && paid.groupName === activeGroupName
      );

      
      const currentUserPaid = paids?.filter(
        (paid) => paid.whoPaid === whoPaid && paid.groupName === activeGroupName
      );

      let totalAmount = spents?.reduce((sum, item) => {
        const shouldIncludeUser =
          whoPaid === user.name && item.whoPaid !== user.name;
        const shareAmount = Number(
          (item.cost / (item.sharedWith?.length + 1)).toFixed(2)
        );

        if (item.whoPaid === whoPaid) {
          return sum + (item.cost - shareAmount);
        }

        if (item.sharedWith?.includes(whoPaid) || shouldIncludeUser) {
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

      return Number(totalAmount).toFixed(2);
    },
    [activeGroup, activeGroupName, paids, spents, user.name]
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

      const demands =
        paids
          ?.filter(
            (payment) =>
              payment.whoPaid === selectedFriend &&
              payment.toWho === friend &&
              payment.groupName === activeGroupName
          )
          .reduce((total, payment) => total + payment.howMuchPaid, 0) || 0;

      const debts =
        paids
          ?.filter(
            (payment) =>
              payment.whoPaid === friend &&
              payment.toWho === selectedFriend &&
              payment.groupName === activeGroupName
          )
          .reduce((total, payment) => total + payment.howMuchPaid, 0) || 0;

      return Number(totalAmounts + demands - debts).toFixed(2);
    },

    [activeGroup?.howSpent, paids, selectedFriend, user.name, activeGroupName]
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
        groupName: activeGroupName,
      };

      const updatedPaids = (prevPaids) => {
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
  //     // setPaids(updatedPaids);
  //  console.log(paids);
   

      const { error } = paids.length === 0
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
