import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setSignInUserData,
  selectUserData,
} from "../../redux/reducers/userDataSlice";
import { Link } from "react-router-dom";
import { supabase } from "../../../supabase";
import { setGroupData } from "../../redux/reducers/dummyDataSlice";
interface Group {
  id: string;
  groupName: string;
  friends: string;
}

const LeftComponent = () => {
  const userData = useSelector(selectUserData);
  const dispatch = useDispatch();
  const [groups, setGroups] = useState<Group[]>([]);

  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedFriend, setSelectedFriend] = useState("");

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data: groupsData, error } = await supabase
          .from("groups")
          .select("*")
          .eq("userId", userData.id);

        if (error) {
          throw new Error(error.message);
        }

        setGroups(groupsData || []);
        dispatch(setGroupData(groupsData));
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };

    fetchGroups();
  }, [userData.id]);

  const friends = groups.map((group: Group) => group.friends);

  const handleClickOnGroup = (groupName: string) => {
    dispatch(
      setSignInUserData({
        activeGroup: groupName,
        activeFriend: null,
      })
    );
    setSelectedGroup(groupName);
    setSelectedFriend("");
  };

  const handleClickOnFriends = (friend: string) => {
    dispatch(
      setSignInUserData({
        activeFriend: friend,
        activeGroup: null,
      })
    );
    setSelectedFriend(friend);
    setSelectedGroup("");
  };



  return (
    <div className="right-contianer p-3">
      <div className="dashboard">
        <img
          src="https://assets.splitwise.com/assets/core/logo-square-65a6124237868b1d2ce2f5db2ab0b7c777e2348b797626816400534116ae22d7.svg"
          className="img-fluid"
          alt="Sample image"
        />
        <p>Dashboard</p>
      </div>

      <div className="recent-activity">
        <i className="fa-solid fa-flag"></i>
        <h6>Recent activity</h6>
      </div>

      <div className="expenses row">
        <i className="fa fa-list col-1 pt-1"></i>
        <p className="col-10">All expenses</p>
      </div>

      <div className="group">
        <div className="sec-type">
          <p>GROUPS</p>
          <Link to="/groups/new" className="text-decoration-none">
            <div className="add-btn">
              <i className="fa-solid fa-plus" />
              add
            </div>
          </Link>
        </div>

        <div className="sec-text-area group-list">
          {groups.map((group) => (
            <li
              key={group.id}
              className={group.groupName === selectedGroup ? "open" : ""}
            >
              <h6 onClick={() => handleClickOnGroup(group.groupName)}>
                <i className="fa-solid fa-tag"></i>
                {group.groupName}
              </h6>
            </li>
          ))}
        </div>
      </div>

      <div className="friends">
        <div className="sec-type">
          <p>FRIENDS</p>
        </div>

        <div className="sec-text-area">
          {friends.flat().map((friend, index) => (
            <li key={index} className={friend === selectedFriend ? "open" : ""}>
              <h6 onClick={() => handleClickOnFriends(friend)}>
                <i className="fa fa-user"></i>
                {friend}
              </h6>
            </li>
          ))}

          <div className="invite-box">
            <div className="invite-header">Invite friends</div>
            <div className="invite-input">
              <input
                className="invite-email"
                type="email"
                placeholder="Enter an email address"
              />
              <button className="btn btn-cancel send-invite">
                Send invite
              </button>
            </div>
            <div className="social-left">
              <div>
                <button className="facebook">
                  <img
                    src="https://secure.splitwise.com/assets/fat_rabbit/social/facebook.png"
                    alt="Facebook"
                  />
                  Share
                </button>
              </div>
              <div>
                <button className="tweet">
                  <img
                    src="https://secure.splitwise.com/assets/fat_rabbit/social/twitter.png"
                    alt="Twitter"
                  />
                  Tweet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftComponent;
