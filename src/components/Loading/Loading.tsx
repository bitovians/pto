import { FC } from "react";

import styles from "./styles.module.scss";

const Loading: FC = () => {
  return (
    <div className={styles.loading}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};

export default Loading;
