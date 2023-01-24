import { NextPage } from "next";
import { useContext } from "react";

import Button from "../components/Button";
import { useLogin } from "../context/hooks/useLogin";
import { Context } from "../context/StateManagement";

import styles from "./styles.module.scss";

const Login: NextPage = () => {
  const { setToken } = useContext(Context);
  const { login } = useLogin();
  console.log({ setToken });

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
