import { memo } from "react";

function NotFound() {
  return (
    <div className="mt-5">
      <h1>404 - Not Found</h1>
      <p>The page you are looking for does not exist.</p>
    </div>
  );
}

export const NotFoundPage = memo(NotFound);
