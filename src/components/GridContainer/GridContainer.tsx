import { FC } from "react";

const GridContainer: FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="grid-container">{children}</div>;
};

export default GridContainer;
