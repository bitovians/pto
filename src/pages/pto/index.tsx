import { useState } from "react";
import { NextPage } from "next";
import { useQuery } from "react-query";

import { getPTOData } from "../../store";
import { Box, TextBox } from "../../components/Box";
import Loading from "../../components/Loading";

type TimeScaleEnum = "days" | "hours";

function formatTime(time: number, scale: TimeScaleEnum) {
  const result = scale === "days" ? time / 8 : time;
  return (result).toFixed(2)
}

const Dashboard: NextPage = () => {
  const { data, isLoading, error } = useQuery<PTO>("pto", getPTOData, {
    retry: 1,
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 10, // 10 minutes
  });
  const [timeScale, setTimeScale] = useState<TimeScaleEnum>("days");

  if (isLoading) {
    return <Loading />;
  }

  if (error || !data) {
    return <div>Something went wrong</div>;
  }

  return (
    <main className="container-fluid">
      <div className="grid">
        <div>
          <fieldset>
            <label>
              <input
                name="terms"
                type="checkbox"
                role="switch"
                onChange={({ target: { checked } }) => {
                  setTimeScale(checked ? "hours" : "days")
                }}
              />
              display hours?
            </label>
          </fieldset>
          <fieldset>
            <a href="/pto/sheets">view breakdown sheets</a>
          </fieldset>
        </div>
      </div>
      <div className="grid">
        <Box value={formatTime(data.totalAvailable, timeScale)} text={`${timeScale} available currently`} />
        <Box
          value={formatTime(data.totalRemainingInYear, timeScale)}
          text={`${timeScale} available by EOY`}
        />
        <Box
          value={formatTime(data.totalAccrued, timeScale)}
          text={`total ${timeScale} accrued`}
        />
        <Box
          value={formatTime(data.totalUsed, timeScale)}
          text={`total ${timeScale} used`}
        />
        <TextBox value={data.startingDate} text="starting date" />
      </div>
    </main>
  );
};

export default Dashboard;
