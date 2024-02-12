import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

const RightComponent = () => {
  const groups = useSelector((state: RootState) => state.dummyData.groups);
  const user = useSelector((state: RootState) => state.userData.user);
  const activeGroupName = user.activeGroup;
  const activeGroup = groups.find(
    (group) => group.groupName === activeGroupName
  );
  const friends = activeGroup ? activeGroup.friends : [];
  const totalAmount = useSelector((state: RootState) => state.totalAmonut);

  const calculateTotalAmount = (whoPaid: string) => {
    if (activeGroup) {
      const totalAmount = activeGroup.howSpent?.reduce((sum, item) => {
        if (item.sharedWith.includes(whoPaid) || whoPaid === user.name) {
          const shareAmount = item.cost / (item.sharedWith.length + 1);
          return item.whoPaid === whoPaid
            ? sum + (item.cost - shareAmount)
            : sum - shareAmount;
        }
        return sum;
      }, 0);

      return Number(totalAmount?.toFixed(2));
    }

    return 0;
  };

  return (
    <>
      {user.activeGroup && friends.length > 0 && (
        <div className="col mt-3">
          <h5 className="right-title">GROUP BALANCES</h5>
          <ul className="list-group list-group-flush text-start">
            {friends.map((member, index) => (
              <li className="right-part-member" key={member}>
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
            <li className="right-part-member">
              <div className="image">
                <img
                  className="rounded-circle"
                  src="https://s3.amazonaws.com/splitwise/uploads/user/default_avatars/avatar-ruby38-50px.png"
                />
              </div>
              <div className="member-data">
                <p>{user.name}</p>
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
        </div>
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
