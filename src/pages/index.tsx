import { NextPage } from "next";
import { useRouter } from "next/router";

import Button from "../components/Button";
import { useLogin } from "../context/hooks/useLogin";

import styles from "./styles.module.scss";

const Login: NextPage = () => {
  const { login } = useLogin();
  const { push } = useRouter();

  const loginAction = () => {
    login().then((res) => {
      if (res === "success") {
        push("/pto");
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1>PTO APP</h1>

        <Button onClick={loginAction}>Login</Button>
      </div>
    </div>
  );
};

export default Login;
