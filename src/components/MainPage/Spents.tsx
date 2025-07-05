import "./MainPage.css";
import { useSelector } from "react-redux";
import { GroupActiveState } from "./GroupActiveState";
import { FriendActiveState } from "./FriendActiveState";
import { Link } from "react-router-dom";
import { RootState } from "../../redux/store";
import toast from "react-hot-toast";
import { memo, useMemo } from "react";
import { Expense, getGroupPayments } from "../../utils/balanceCalculations";
import { UserBalanceView } from "./UserBalanceView";

function SpentsComponent() {
  const user = useSelector((state: RootState) => state.userData.user);
  const paids = useSelector((state: RootState) => state.paids);
  const spents = useSelector((state: RootState) => state.spents);
  const groups = useSelector((state: RootState) => state.groups.groups);

  // Convert expenses to the format expected by balance calculations
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
    const activeGroup = groups.find(
      (group) => group.groupName === user.activeGroup
    );
    if (!activeGroup) return [];

    return getGroupPayments(paids || [], activeGroup);
  }, [paids, user.activeGroup, groups]);

  // Get current group members
  const currentGroupMembers = useMemo(() => {
    const activeGroup = groups.find(
      (group) => group.groupName === user.activeGroup
    );
    return activeGroup ? [user.name, ...activeGroup.friends] : [user.name];
  }, [groups, user.activeGroup, user.name]);

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

      {/* Use the generalized UserBalanceView for current user */}
      {user.activeGroup && (
        <UserBalanceView
          targetUser={user.name}
          groupMembers={currentGroupMembers}
          expenses={expenses}
          payments={groupPayments}
          viewingUser={user.name}
          showIndividual={true}
          showGroupSummary={false}
        />
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
              Click "Add an expense" above to get started, or invite some
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
      {user.activeFriend && <FriendActiveState />}
    </section>
  );
}

export const Spents = memo(SpentsComponent);
