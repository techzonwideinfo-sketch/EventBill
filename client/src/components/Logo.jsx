import React from 'react';

const Logo = ({ className = '', style = {} }) => {
  return (
    <img 
      src="/Event Logo.png" 
      alt="EventBill" 
      className={`max-w-full h-auto block ${className}`}
      style={{ objectFit: 'contain', ...style }}
    />
  );
};

export default Logo;
