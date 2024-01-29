import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setGroupData, setSignInUserData } from '../../redux/reducers/dummyDataSlice';
import { selectUserData } from '../../redux/reducers/userDataSlice';

const FriendActiveState = () => {
  const groups = useSelector((state) => state.dummyData.groups);
  const user = useSelector(selectUserData);
  const dispatch = useDispatch();
  const [mutualGroups, setMutualGroups] = useState(null);

  const updateData = (activeFriend) => {
    let result = groups.filter((group) => group.friends.includes(activeFriend));
    let mutualGroups = null;

    if (result.length > 0) {
      mutualGroups = result.reduce((acc, group) => {
        let members = group.friends.length + 1;
        acc[group.groupName] = (
          group.howSpent.reduce((sum, data) => sum + data.cost, 0) / members
        ).toFixed(2);
        return acc;
      }, {});
    }

    setMutualGroups(mutualGroups);
  };

  useEffect(() => {
    updateData(user.activeFriend);
  }, [user.activeFriend]);

  return (
    <>
      {mutualGroups && user.activeFriend && (
        <div className='container'>
          <ul className='list-group mt-2 mx-2'>
            {Object.entries(mutualGroups).map(([groupName, cost]) => (
              <li key={groupName} className='list-group-item message-container mt-1'>
                <div className='message-date group-name-date'>
                  <div>
                    <p>FEB</p>
                    <p>02</p>
                  </div>
                  <div className='group-name-container'>
                    <img src='https://secure.splitwise.com/assets/fat_rabbit/group-icon.png'></img>
                    <h6>{groupName}</h6>
                  </div>
                </div>
                <div className='spent-status'>
                  <div className='lent'>
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