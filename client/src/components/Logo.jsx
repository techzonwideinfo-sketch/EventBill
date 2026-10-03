import React from 'react';

const Logo = ({ className = '', style = {} }) => {
  return (
    <div className={`flex items-center ${className}`} style={style}>
      <span className="text-[#253C6D] font-black text-2xl tracking-tighter uppercase">
        Event<span className="text-[#F2842F]">Bill</span>
      </span>
    </div>
  );
};

export default Logo;
