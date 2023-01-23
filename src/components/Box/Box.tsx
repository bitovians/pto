interface IBox {
  value: string;
  text: string;
}

const Box = ({ value, text }: IBox) => {
  return (
    <div className="box">
      {value}
      <p>{text}</p>
    </div>
  );
};

export default Box;
