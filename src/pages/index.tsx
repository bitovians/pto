import { NextPage } from "next";
import Button from "../components/Button";
import { useLogin } from "../store/hooks/useLogin";

import styles from "./styles.module.scss";

const Login: NextPage = () => {
  const { login } = useLogin();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1>PTO APP</h1>

        <Button onClick={login}>Login</Button>
      </div>
    </div>
  );
};

export default Login;
