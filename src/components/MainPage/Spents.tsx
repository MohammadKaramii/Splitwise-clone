import "./MainPage.css";
import { useSelector} from "react-redux";
import GroupActiveState from "./GroupActiveState";
import FriendActiveSatate from "./FriendActiveState";
import { Link } from "react-router-dom";
import { RootState } from "../../redux/store";
import toast from "react-hot-toast";
import { useMemo } from "react";
const MiddleComponent = () => {
  const user = useSelector((state: RootState) => state.userData.user);
  const paids = useSelector((state: RootState) => state.paids);
  const paidToCurrentUser = paids?.filter((paid) => paid.toWho === user.name && paid.groupName === user.activeGroup);
  const currentUserPaid = paids?.filter((paid) => paid.whoPaid === user.name && paid.groupName === user.activeGroup);
  const spents = useSelector((state: RootState) => state.spents);



  const totalAmount = useMemo(() => {
    let calculatedAmount =
    spents?.reduce((sum, item) => {
        if (item.whoPaid === user.name) {
          return (
            sum +
            Number(
              (item?.cost - item?.cost / (item.sharedWith?.length + 1)).toFixed(2)
            )
          );
        } else {
          return (
            sum - Number((item?.cost / (item.sharedWith?.length + 1)).toFixed(2))
          );
        }
      }, 0) || 0;

      if (paidToCurrentUser) {
        
        const demands = paidToCurrentUser.reduce(
          (total, paid) => total + paid.howMuchPaid,
          0
        );
       
        calculatedAmount -= demands
      }

      if (currentUserPaid) {
        const debts = currentUserPaid.reduce(
          (total, paid) => total + paid.howMuchPaid,
          0
        );
        calculatedAmount += debts

      }

      return calculatedAmount;
  }, [spents, paidToCurrentUser, currentUserPaid, user.name]);


  return (
    <section className="middle-component-container">
      <div className="middle-nav">
        <div className="title-bar">
          {!user.activeGroup && !user.activeFriend && (
            <>
              <img
                src="https://s3.amazonaws.com/splitwise/uploads/group/default_avatars/avatar-ruby33-house-50px.png"
                alt="avatar"
              ></img>
              <span>
                <h3> DashBoard</h3>
              </span>
            </>
          )}

          {user.activeGroup && (
            <>
              <img
                src="https://s3.amazonaws.com/splitwise/uploads/group/default_avatars/avatar-ruby33-house-50px.png"
                alt="avatar"
              ></img>
              <span>
                <h3>{user.activeGroup}</h3>
              </span>
            </>
          )}

          {user.activeFriend && (
            <div className="frnd-title-img">
              <img
                src="https://s3.amazonaws.com/splitwise/uploads/user/default_avatars/avatar-grey4-100px.png"
                alt="avatar"
              ></img>
              <span>
                <h3>{user.activeFriend}</h3>
              </span>
            </div>
          )}
        </div>

        <div className="top-btns">
          <div className="signup-btn">
            <Link
              to={`${
                user.activeGroup || user.activeFriend ? "/addexpense" : ""
              }`}
            >
              <button
                type="submit"
                onClick={() => {
                  if (!user.activeGroup && !user.activeFriend) {
                    toast.error(
                      "Please select a group or friend before adding an expense."
                    );
                  }
                }}
              >
                Add an expense
              </button>
            </Link>
          </div>
        </div>
      </div>
      {user.activeGroup && (
        <table className="table table-bordered">
          <tbody>
            <tr>
              <td scope="col">
                <div className="flex-grow-1">
                  <p className="mb-1 font-weight-light">total balance</p>
                  <p
                    className={`font-weight-light ${
                      totalAmount > 0
                        ? "price"
                        : totalAmount < 0
                        ? "price-lose"
                        : "price-zero"
                    }`}
                  >
                    ${totalAmount ? totalAmount.toFixed(2) : 0}
                  </p>
                </div>
              </td>
              <td scope="col">
                <div className="flex-grow-1">
                  <p className="mb-1 font-weight-light">you owe</p>
                  <p
                    className={`font-weight-light ${
                      totalAmount < 0 ? "price-lose" : "price-zero"
                    }`}
                  >
                    ${totalAmount > 0 ? 0 : totalAmount.toFixed(2)}
                  </p>
                </div>
              </td>
              <td scope="col">
                <div className="flex-grow-1">
                  <p className="mb-1 font-weight-light">you are owed</p>
                  <p
                    className={`font-weight-light ${
                      totalAmount > 0
                        ? "price"
                        : totalAmount < 0
                        ? "price-lose"
                        : "price-zero"
                    }`}
                  >
                    ${totalAmount < 0 ? 0 : totalAmount.toFixed(2)}
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      )}
      {!user.activeGroup && !user.activeFriend && (
        <div className="row middle-bottom p-4">
          <img
            src="https://assets.splitwise.com/assets/fat_rabbit/person-2d59b69b3e7431884ebec1a55de75a4153a17c4050e6b50051ca90412e72cf96.png"
            alt="avatar"
          ></img>
          <div className="col middle-bottom-text">
            <h3>Welcome to Splitwise!</h3>
            <p>Splitwise helps you split bills with friends.</p>
            <p>
              Click “Add an expense” above to get started, or invite some
              friends first!
            </p>
            <div className="signup-btn">
              <button type="submit">
                <i className="fa fa-plus"></i>{" "}
                <i className="fa fa-user user"></i>
                Add friends on Splitwise
              </button>
            </div>
          </div>
        </div>
      )}

      {user.activeGroup && <GroupActiveState />}
      {user.activeFriend && <FriendActiveSatate />}
    </section>
  );
};

export default MiddleComponent;
