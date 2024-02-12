import HeaderUser from "../HeaderUser/HeaderUser"
import LeftComponent from "./LeftComponent"
import MiddleComponent from "./MiddleComponent"
import RightComponent from "./RightComponent"
import "./MainPage.css"


const MainPage = () => {
    return (
        <>
           <HeaderUser />
           <div className="container main-box">
              <div className="row">
                 <div className="col-lg-3">
                    <LeftComponent />
                 </div>
                 <div className="col-lg-6 col-sm-12">
                    <MiddleComponent />
                 </div>
                 <div className="col-lg-3">
                    <RightComponent />
                 </div>
              </div>
           </div>
        </>
     )
}

export default MainPage