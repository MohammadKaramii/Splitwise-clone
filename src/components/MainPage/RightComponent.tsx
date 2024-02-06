import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

interface Group {
  friends: string[];
}

interface HowSpent {
  message: string;
  cost: number;
  id: string;
  createdAt: string;
}

const RightComponent = () => {
  const groups = useSelector((state: RootState) => state.dummyData.groups);
  const user = useSelector((state: RootState) => state.userData.user);

  const [members, setMembers] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [owesYou, setOwesYou] = useState(0);
  const [_howSpent, setHowSpent] = useState<HowSpent[]>();
  const [paidMembers, setPaidMembers] = useState<string[]>([]);

  const updateFriend = (activeFriend: string) => {
    const result = groups.filter((group: Group) =>
      group.friends.includes(activeFriend)
    );

    if (result.length > 0) {
      const amount = result
        .map((group) => group.howSpent)
        .map((group) => group?.reduce((sum, amount) => (sum += amount.cost), 0))
        ?.reduce((sum, amount) => (sum += amount));

      setTotalAmount(amount);

      if (result.length > 0 && owesYou > 0) {
        setOwesYou(Number((totalAmount / members.length).toFixed(2)));
      }
    }
  };

  const updateGroup = (activeGroup: string) => {
    const result = groups.filter((group) => group.groupName === activeGroup);

    if (result.length > 0) {
      const amount = result[0].howSpent?.reduce(
        (sum, amount) => (sum += amount.cost),
        0
      );

      setTotalAmount(amount);

      const paidUsers = result[0].paid?.reduce((acc: string[], member) => {
        const person = Object.entries(member);
        acc.push(person[0][0]);
        return acc;
      }, []);

      setPaidMembers(paidUsers);
      setHowSpent(result[0].howSpent);
      setMembers(result[0].friends);
    }
  };

  useEffect(() => {
    if (user.activeGroup) {
      updateGroup(user.activeGroup);
    }

    if (user.activeFriend) {
      updateFriend(user.activeFriend);
    }
  }, [user.activeGroup, user.activeFriend]);

  const share: number = totalAmount
    ? parseFloat((totalAmount / (members.length + 1)).toFixed(2))
    : 0;
  const getsBack: number =
    share * (members.length - (paidMembers ? paidMembers.length : 0));
  
    return (
    <>
      {user.activeGroup && members !== null && (
        <div className="col mt-3">
          <h5 className="right-title">GROUP BALANCES</h5>
          <ul className="list-group list-group-flush text-start">
            {members.map((member, index) => {
              const link = `https://s3.amazonaws.com/splitwise/uploads/user/default_avatars/avatar-grey${
                index + 1
              }-100px.png`;

              return (
                <li className="right-part-member" key={member}>
                  <div className="image">
                    <img className="rounded-circle" src={link} alt={member} />
                  </div>
                  <div className="member-data">
                    <p>{member}</p>
                    <div className="text-danger">
                      <span>owes</span>
                      {!paidMembers || !paidMembers.includes(member) ? (
                        <span className="h5"> ${share}</span>
                      ) : (
                        <span className="h5"> $0.00</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
            <li className="right-part-member">
              <div className="image">
                <img
                  className="rounded-circle"
                  src="https://s3.amazonaws.com/splitwise/uploads/user/default_avatars/avatar-ruby38-50px.png"
                />
              </div>
              <div className="member-data">
                <p>{user.name}</p>
                <div className="text-success">gets back ${getsBack}</div>
              </div>
            </li>
          </ul>
        </div>
      )}

      {user.activeFriend && (
        <div className="right-component container mt-5 right-component-friend">
          <h5>YOUR BALANCE</h5>
          <h6>{user.activeFriend} owes you</h6>
          <strong>${owesYou}</strong>
        </div>
      )}

      <div className="container mt-4 right-component">
        <h5>HEY THERE!</h5>
        <div className="right-textContainer">
          <p>It looks like you use an ad blocker. That’s cool! So do we :)</p>
          <p>Please support Splitwise by telling your friends about us!</p>
          <div className="social">
            <button className="facebook">
              <img
                src="https://secure.splitwise.com/assets/fat_rabbit/social/facebook.png"
                alt="Facebook"
              />{" "}
              Share
            </button>
            <button className="tweet">
              <img
                src="https://secure.splitwise.com/assets/fat_rabbit/social/twitter.png"
                alt="Twitter"
              />{" "}
              Tweet
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RightComponent;
