import { FC } from "react";

import styles from "./styles.module.scss";

export const GridContainer: FC<{ children: React.ReactNode, halfWidth?: boolean }> = ({ children, halfWidth = false }) => {
  return <div className={halfWidth ? styles.containerHalfWidth : styles.container}>{children}</div>;
};

export default GridContainer;
