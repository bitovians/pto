import { FC } from "react";

const PageHeader: FC = () => {
  return (
    <div className="logos">
      <span
        className="bitovi-logo"
        role="presentation"
        aria-label="bitovi-logo"
      />
      <img
        src="https://www.freshbooks.com/wp-content/themes/freshpress/dist/images/logos/freshbooks-logo.svg"
        alt="freshbooks logo"
        width="155"
        height="38"
      />
    </div>
  );
};

export default PageHeader;
