import { NextPage } from "next";
import { useState, useEffect } from "react";

import { PTO, useGetPTO } from "../../context/hooks/useGetPTO/useGetPTO";

import Box from "../../components/Box";
import GridContainer from "../../components/GridContainer";
import Loading from "../../components/Loading";

import styles from "./styles.module.scss";

const Dashboard: NextPage = () => {
  const [data, setData] = useState<PTO | undefined>();
  const { getPTO, loading } = useGetPTO();

  useEffect(() => {
    getPTO().then((res) => setData(res));
  }, []);

  return (
    <div className={styles.container}>
      {loading ? (
        <Loading />
      ) : (
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
      )}
    </div>
  );
};

export default Dashboard;
