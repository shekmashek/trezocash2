import React from 'react';

const WidgetIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="9" height="9" x="3" y="3" rx="1" />
    <rect width="9" height="5" x="3" y="16" rx="1" />
    <rect width="5" height="9" x="16" y="3" rx="1" />
    <rect width="5" height="5" x="16" y="16" rx="1" />
  </svg>
);

export default WidgetIcon;
