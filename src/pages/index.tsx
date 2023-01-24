import { NextPage } from "next";
import { useContext } from "react";

import Button from "../components/Button";
import { useLogin } from "../context/hooks/useLogin";
import { Context } from "../context/StateManagement";

import styles from "./styles.module.scss";

const Login: NextPage = () => {
  const { login } = useLogin();

  const { token, apiBaseURL } = useContext(Context);

  const loginAction = () => {
    login();
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1>PTO APP</h1>

        <p>
          <strong>apiBaseURL:</strong> {apiBaseURL}
        </p>
        <p>
          <strong>code:</strong> {}
        </p>
        <p style={{ lineBreak: "anywhere" }}>
          <strong>access_token:</strong> {token}
        </p>

        <Button onClick={loginAction}>Login</Button>
      </div>
    </div>
  );
};

export default Login;
