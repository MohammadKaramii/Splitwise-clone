import { memo } from "react";
import { BounceLoader } from "react-spinners";

function LoadingComponent() {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <BounceLoader color="#39a385" size={40} />
    </div>
  );
}

export const Loading = memo(LoadingComponent);
