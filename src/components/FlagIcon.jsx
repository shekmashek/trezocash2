import React from 'react';

const flags = {
  FR: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" {...props}>
      <rect width="3" height="2" fill="#fff"/>
      <rect width="2" height="2" fill="#002395"/>
      <rect width="1" height="2" fill="#ed2939"/>
    </svg>
  ),
  GB: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" {...props}>
      <clipPath id="s">
        <path d="M0,0 v30 h60 v-30 z"/>
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#00247d"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" clipPath="url(#s)"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#cf142b" strokeWidth="4" clipPath="url(#s)"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" clipPath="url(#s)"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#cf142b" strokeWidth="6" clipPath="url(#s)"/>
    </svg>
  ),
};

const FlagIcon = ({ code, className }) => {
  const FlagComponent = flags[code];
  if (!FlagComponent) return null;
  return <FlagComponent className={className} />;
};

export default FlagIcon;
