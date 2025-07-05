import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useMemo, useEffect, memo } from "react";
import { ListGroupCard } from "./ListGroupCard";
import { uid } from "uid";
import { getGroupPayments } from "../../utils/balanceCalculations";

function GroupActiveStateComponent() {
  const groups = useSelector((state: RootState) => state.groups.groups);
  const paids = useSelector((state: RootState) => state.paids);
  const activeGroupName = useSelector(
    (state: RootState) => state.userData.user.activeGroup
  );
  const activeGroup = useMemo(
    () => groups.find((group) => group.groupName === activeGroupName),
    [groups, activeGroupName]
  );
  const spents = useSelector((state: RootState) => state.spents);

  const totalAmount = useMemo(
    () =>
      activeGroup
        ? activeGroup?.howSpent?.reduce((sum, item) => sum + item.cost, 0)
        : 0,
    [activeGroup]
  );

  useEffect(() => {
    if (!activeGroup || !activeGroup.howSpent) {
      return;
    }
  }, [activeGroup]);

  return (
    <div className="container d-flex flex-column">
      <ul className="list-group mt-2 mx-2">
        {spents?.map((data) => (
          <li key={data.id} className="list-group-item message-container">
            <ListGroupCard
              data={data}
              members={data.sharedWith}
              totalAmount={totalAmount}
            />
          </li>
        ))}
      </ul>
      <ul className="paid-list">
        {paids ? (
          <>
            <h5>Transactions</h5>
            {(() => {
              if (!activeGroup) return [];
              return getGroupPayments(paids, activeGroup);
            })().map((member) => {
              return paids ? (
                <li className="paid-person-container" key={uid()}>
                  <i className="fa-regular fa-circle-check mx-1"></i>
                  <span>
                    <strong> {member.whoPaid}</strong>
                  </span>
                  <span className=""> paid his share of </span>
                  <strong>${member.howMuchPaid}</strong>
                  <span className=""> to </span>
                  <strong>{member.toWho}</strong>
                </li>
              ) : null;
            })}
          </>
        ) : null}
      </ul>
    </div>
  );
}

export const GroupActiveState = memo(GroupActiveStateComponent);
