import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { selectUserData } from "../../redux/reducers/userDataSlice";
import { RootState } from "../../redux/store";

interface Group {
  groupName: string;
  friends: string[];
  howSpent: { cost: number }[];
}

const FriendActiveState: React.FC = () => {
  const groups = useSelector((state: RootState) => state.dummyData.groups);
  const user = useSelector(selectUserData);
  const [mutualGroups, setMutualGroups] = useState<{
    [key: string]: number;
  } | null>(null);

  const updateData = (activeFriend: string | null): void => {
    if (!activeFriend) {
      setMutualGroups(null);
      return;
    }

    const result = groups.filter((group: Group) =>
      group.friends.includes(activeFriend)
    );
    let updatedMutualGroups: { [key: string]: number } | null = null;

    if (result.length > 0) {
      updatedMutualGroups = result?.reduce((acc, group) => {
        const members = group.friends.length + 1;

        acc[group.groupName] = 
          group.howSpent ? 
          Number((group.howSpent.reduce((sum, data) => sum + data.cost, 0) / members).toFixed(2)) : 0;

        return acc;
      }, {} as { [key: string]: number });
    }



    setMutualGroups(updatedMutualGroups);
  };

  useEffect(() => {
    updateData(user.activeFriend);
  }, [user.activeFriend]);

  const handleTime = (groupName: string) => {
    const currentGroup = groups.find((group) => group.groupName === groupName);
    const timeUpdate = currentGroup?.lastUpdate!;
    const month = new Date(timeUpdate)
      .toLocaleString("en-US", { month: "long" })
      .slice(0, 3);
    const day = new Date(timeUpdate).getDate();
    return { month, day};
  };

  return (
    <>
      {mutualGroups && user.activeFriend && (
        <div className="container">
          <ul className="list-group mt-2 mx-2">
            {Object.entries(mutualGroups).map(([groupName, cost]) => (
              <li
                key={groupName}
                className="list-group-item message-container mt-1"
              >
                <div className="message-date group-name-date">
                  <div>
                    <p>{handleTime(groupName).month}</p>
                    <p>{handleTime(groupName).day}</p>

                  </div>
                  <div className="group-name-container">
                    <img
                      src="https://secure.splitwise.com/assets/fat_rabbit/group-icon.png"
                      alt="group-icon"
                    ></img>
                    <h6>{groupName}</h6>
                  </div>
                </div>
                <div className="spent-status">
                  <div className="lent">
                    <p>{user.name} owes you</p>
                    <strong>${cost}</strong>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default FriendActiveState;
