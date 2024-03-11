import { NextPage } from "next";
import { useQuery } from "react-query";
import { useRouter } from "next/router";
import { format } from "date-fns";

import { getPTOData, logout } from "../../store";
import Loading from "../../components/Loading";

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
    <main className="container-fluid">
      <div className="grid">
        <div>
          <h4>Accruals</h4>
          <table className="striped">
            <thead>
              <tr>
                <th>Accrued</th>
                <th>Total</th>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              {data?.accruals.map(accrual => {
                return (<tr>
                  <td>+{accrual.accrued.toFixed(2)}</td>
                  <td>{accrual.total.toFixed(2)}</td>
                  <td>{format(new Date(accrual.start), 'MM/dd/yyyy')}</td>
                  <td>{format(new Date(accrual.end), 'MM/dd/yyyy')}</td>
                </tr>)
              })}
            </tbody>
          </table>
        </div>
        <div>
          <h4>Deductions</h4>
          <table className="striped">
            <thead>
              <tr>
                <th>Used</th>
                <th>Total</th>
                <th>Note</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.deductions.map(deduction => {
                return (<tr>
                  <td>-{(deduction.duration).toFixed(2)}</td>
                  <td>{(deduction.total).toFixed(2)}</td>
                  <td>{deduction.note}</td>
                  <td>{format(new Date(deduction.local_started_at), 'MM/dd/yyyy')}</td>
                </tr>)
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
