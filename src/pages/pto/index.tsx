import { NextPage } from "next";
import { useQuery } from "react-query";
import { useRouter } from "next/router";

import { getPTOData, logout } from "../../store";
import { Box, TextBox } from "../../components/Box";
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

  function handleLogout() {
      logout();
      push("/");
  }

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <div>Something went wrong</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.logout}>
        <Button onClick={handleLogout}>Logout</Button>
      </div>
      <GridContainer>
        <Box value={data?.totalAccrued.hours ?? ""} text="Available hours" />
        <Box value={data?.totalAccrued.days ?? ""} text="Available days" />
        <Box
          value={data?.totalAvailable.hours ?? ""}
          text="Total hours available in the year"
        />
        <Box
          value={data?.totalAvailable.days ?? ""}
          text="Total days available in the year"
        />
        <Box
          value={data?.allTimeAccrued.hours ?? ""}
          text="All-Time hours accrued"
        />
        <TextBox value={data?.startingDate ?? ""} text="Staring date (first punch)" />
      </GridContainer>
    </div>
  );
};

export default Dashboard;
