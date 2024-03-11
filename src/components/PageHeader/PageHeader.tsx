import { FC } from "react";
import Button from "../../components/Button";
import { useRouter } from "next/router";
import { logout } from "../../store";

const PageHeader: FC = () => {
  const { push } = useRouter();
  function handleLogout() {
    logout();
    push("/");
  }

  return (
    <header className="logos">
      <span
        className="bitovi-logo"
        role="presentation"
        aria-label="bitovi-logo"
      />
      <img
        src="/pto/images/freshbooks-logo-light-mode.svg"
        className="light-mode"
        alt="freshbooks logo"
        width="155"
        height="38"
      />
      <img
        src="/pto/images/freshbooks-logo-dark-mode.svg"
        className="dark-mode"
        alt="freshbooks logo"
        width="155"
        height="38"
      />
      <div className="logout">
        <Button onClick={handleLogout}>Logout</Button>
      </div>
    </header>
  );
};

export default PageHeader;
