import React from 'react';

const Logo = ({ className = '', style = {} }) => {
  return (
    <div className={`flex items-center ${className}`} style={style}>
      <span className="text-[#253C6D] font-black text-2xl tracking-tighter uppercase">
        MOI <span className="text-[#F2842F]">BILL</span>
      </span>
    </div>
  );
};

export default Logo;
