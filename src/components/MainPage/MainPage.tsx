import HeaderUser from "../HeaderUser/HeaderUser"
import LeftComponent from "./LeftComponent"
import MiddleComponent from "./MiddleComponent"
import RightComponent from "./RightComponent"



const MainPage = () => {
    return (
        <>
           <HeaderUser />
           <div className="container main-box">
              <div className="row">
                 <div className="col">
                    <LeftComponent />
                 </div>
                 <div className="col-lg-7 col-sm-12">
                    <MiddleComponent />
                 </div>
                 <div className="col">
                    <RightComponent />
                 </div>
              </div>
           </div>
        </>
     )
}

export default MainPage