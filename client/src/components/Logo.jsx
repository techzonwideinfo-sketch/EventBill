import React from 'react';
import { Receipt } from 'lucide-react';

const Logo = ({ className = '', style = {} }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`} style={style}>
      <div className="bg-[#F2842F] p-1.5 rounded-lg flex items-center justify-center">
        <Receipt className="text-white w-5 h-5" strokeWidth={2.5} />
      </div>
      <span className="text-[#253C6D] font-bold text-xl tracking-tight">EventBill</span>
    </div>
  );
};

export default Logo;
