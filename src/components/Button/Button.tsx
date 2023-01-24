import { AnchorHTMLAttributes } from "react";
import styles from "./styles.module.scss";

type ButtonProps = AnchorHTMLAttributes<HTMLAnchorElement>;

export const Button = ({ children, ...rest }: ButtonProps) => (
  <a className={styles.container} {...rest}>
    {children}
  </a>
);

export default Button;
