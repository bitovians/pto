import { NextPage } from "next";
import { useQuery } from "react-query";
import { useRouter } from "next/router";

import { PTO, getPTOData } from "../../store";
import Box from "../../components/Box";
import GridContainer from "../../components/GridContainer";
import Loading from "../../components/Loading";
import Button from "../../components/Button";

import styles from "./styles.module.scss";

const Dashboard: NextPage = () => {
  const { push } = useRouter();
  const { data, isLoading, error } = useQuery<PTO>("pto", getPTOData, {
    retry: 1,
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 10, // 10 minutes
  });

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <div>Something went wrong</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.logout}>
        <Button onClick={() => push("/")}>Logout</Button>
      </div>
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
