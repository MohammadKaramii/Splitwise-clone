import { HeaderUser } from "../HeaderUser/HeaderUser";
import { GroupsAndFriends } from "./GroupsAndFriends";
import { Spents } from "./Spents";
import { InfoOwes } from "./InfoOwes";
import "./MainPage.css";
import { memo } from "react";

function Main() {
  return (
    <>
      <HeaderUser />
      <div className="container main-box">
        <div className="row">
          <div className="col-lg-3">
            <GroupsAndFriends />
          </div>
          <div className="col-lg-6 col-sm-12">
            <Spents />
          </div>
          <div className="col-lg-3">
            <InfoOwes />
          </div>
        </div>
      </div>
    </>
  );
}

export const MainPage = memo(Main);
