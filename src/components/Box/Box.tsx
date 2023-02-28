import styles from "./styles.module.scss";

interface IBox {
  value: string;
  text: string;
}

function formatNumber(value: string) {
  if (Number.isNaN(value)) return value;
  return Number(value).toFixed(2);
}

const Box = ({ value, text }: IBox) => {
  return (
    <div className={styles.box}>
      <span>{formatNumber(value)}</span>
      <p>{text}</p>
    </div>
  );
};

export default Box;
