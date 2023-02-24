import { NextPage } from "next";
import { useState, useEffect } from "react";

import { PTO, getPTOData } from "../../store";
import Box from "../../components/Box";
import GridContainer from "../../components/GridContainer";

import styles from "./styles.module.scss";

const Dashboard: NextPage = () => {
  const [data, setData] = useState<PTO | null>(null);

  useEffect(() => {
    const getData = async () => {
      const ptoData = await getPTOData();
      setData(ptoData);
    };

    getData();
  }, []);
  return (
    <div className={styles.container}>
      <GridContainer>
        <Box value={data?.totalAccrued.hours ?? ""} text="Accrued hours" />
        <Box value={data?.totalAccrued.days ?? ""} text="Accrued days" />
        <Box
          value={data?.totalAvailable.hours ?? ""}
          text="Total hours available in the year"
        />
        <Box
          value={data?.totalAvailable.days ?? ""}
          text="Total days available in the year"
        />
      </GridContainer>
    </div>
  );
};

export default Dashboard;
