import { NextPage } from "next";
import Button from "../components/Button";
import { useLogin } from "../store/hooks";

import styles from "./styles.module.scss";

const Login: NextPage = () => {
  const { login } = useLogin();

  return (
    <main className="container">      
      <div className="grid">
        <div></div>
        <div>
          <article className={styles.card}>
            <h1>PTO APP</h1>
            <Button onClick={login}>Login</Button>
          </article>
        </div>
        <div></div>
      </div>
    </main>
  );
};

export default Login;
