
import { useSelector } from 'react-redux';
import ListGroupCard from './ListGroupCard';
import { RootState } from '../../redux/store';

const GroupActiveState = () => {
  const groups = useSelector((state: RootState) => state.dummyData.groups);
  const activeGroup = useSelector((state: RootState) => state.userData.user.activeGroup);
  const activeGroupData = groups.find((group) => group.groupName === activeGroup);

  if (!activeGroupData || !activeGroupData.howSpent) return null;
  
  const totalAmount = activeGroupData.howSpent.reduce((sum, item) => sum + item.cost, 0);

  return (
    <div className='container'>
      <ul className='list-group mt-2 mx-2'>
        {activeGroupData.howSpent.map((data) => (
          <li key={data.id} className='list-group-item message-container'>
            <ListGroupCard
              data={data}
              members={data.sharedWith}
              totalAmount={totalAmount}
              paidStatus={activeGroupData.paid}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GroupActiveState;


