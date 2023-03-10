import { FC } from "react";

import styles from "./styles.module.scss";

const GridContainer: FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className={styles.container}>{children}</div>;
};

export default GridContainer;
