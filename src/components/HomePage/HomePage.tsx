import { useState, useEffect } from "react";
import "./HomePage.css";
import { Link } from "react-router-dom";
import image1 from "../../assets/images/image1.png";
import image2 from "../../assets/images/image2.png";
import image3 from "../../assets/images/image3.png";
import image4 from "../../assets/images/image4.png";
import image5 from "../../assets/images/image5.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../../assets/icons";

const HomePage = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % icons.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="d-flex justify-content-between p-1 px-5 navbar-user align-items-center">
        <div className="logo">
          <img
            src="https://assets.splitwise.com/assets/core/logo-square-65a6124237868b1d2ce2f5db2ab0b7c777e2348b797626816400534116ae22d7.svg"
            className="w-25"
          />
          <p>Splitwise </p>
        </div>
        <div className="d-flex">
          <button
            type="button"
            className="btn btn-light btn-primary-light mx-2"
          >
            Log in
          </button>
          <Link to="/signup" className="home-signup-btn">
            <button
              type="button"
              className="btn btn-success btn-primary-dark mx-2"
            >
              Sign up
            </button>
          </Link>
        </div>
      </header>
      <section className="home-row1 background w-100">
        <div className=" info text-start">
          <div className="home-info">
            <strong className="heading h1">
              Less stress when sharing expenses
            </strong>
            <h1 className={` heading ${icons[activeIndex].textColor}`}>
              {icons[activeIndex].title}
            </h1>

            <ul className="Home-pg-icons">
              {icons.map((item, index) => (
                <li key={index}>
                  <FontAwesomeIcon
                    icon={item.icon}
                    color={
                      index === activeIndex ? item.colors[0] : item.colors[1]
                    }
                    fontSize={48}
                  />
                </li>
              ))}
            </ul>

            <p className="description">
              Keep track of your shared expenses and balances with housemates,
              trips, groups, friends, and family.
            </p>
            <Link to="/signup" className="home-signup-btn">
              <button
                type="button"
                className="btn btn-success btn-primary-dark mb-4 btn-lg"
              >
                Sign up
              </button>
            </Link>
            <p>
              Free for <i className="fa-brands fa-apple"></i> iphone,{" "}
              <i className="fa-brands fa-android"> </i> Android and web.
            </p>
          </div>
          <div className="large-palne d-none d-lg-block">
            {icons.map((item, index) => (
              <i className=" d-none d-lg-block">
                <FontAwesomeIcon
                  icon={item.icon}
                  color={item.colors[0]}
                  className={`${index === activeIndex ? "d-flex" : "d-none"}`}
                />
              </i>
            ))}
          </div>
        </div>
      </section>

      <section className="cards-container">
        <div className="row">
          <div className="col box">
            <div className="card text-center box-bg fill-grey">
              <div className="card-body">
                <strong className="card-title">Track balances</strong>
                <p className="card-text text-center mt-2">
                  Settle up with a friend and record any cash or online payment.
                </p>
              </div>
              <div>
                <img className=" mt-3" src={image1} />
              </div>
            </div>
          </div>

          <div className="col box">
            <div className="card text-center box-bg fill-green">
              <div className="card-body">
                <strong className="card-title">Organize expenses</strong>
                <p className="card-text text-center mt-2">
                  Settle up with a friend and record any cash or online payment.
                </p>
              </div>
              <div>
                <img className=" mt-3" src={image2} />
              </div>
            </div>
          </div>

          <div className="w-100"></div>
          <div className="col box">
            <div className="card text-center box-bg fill-orange">
              <div className="card-body">
                <strong className="card-title">Add expenses easily</strong>
                <p className="card-text text-center mt-2">
                  Quickly add expenses on the go before you forget who paid.
                </p>
              </div>
              <div>
                <img className=" mt-3" src={image3} />
              </div>
            </div>
          </div>
          <div className="col box">
            <div className="card text-center box-bg fill-grey">
              <div className="card-body">
                <strong className="card-title">Pay friends back</strong>
                <p className="card-text text-center mt-2">
                  Settle up with a friend and record any cash or online payment.
                </p>
              </div>
              <div>
                <img className=" mt-3" src={image4} />
              </div>
            </div>
          </div>
        </div>
        <div className="row box">
          <div className="row card text-center box-bg fill-purple">
            <div className="bottom-box">
              <div>
                <strong className="card-title">Get even more with PRO</strong>
                <p className="card-text text-center mt-2">
                  Get even more organized with receipt scanning, charts and
                  graphs, currency conversion, and more!
                </p>
                <div className="btn">
                  <Link to="/signup">
                    <button>Sign up</button>
                  </Link>
                </div>
              </div>
              <div className="mt-5">
                <img src={image5} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
