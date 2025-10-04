import React from 'react';
import { motion } from 'framer-motion';

const NavTooltip = ({ title, description, imageUrl }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 pointer-events-none"
    >
      <div className="flex gap-4 items-center">
        <div className="w-20 h-20 flex-shrink-0 bg-blue-50 rounded-lg p-2">
          <img src={imageUrl} alt={title} className="w-full h-full object-contain" />
        </div>
        <div className="flex-grow">
          <h4 className="font-bold text-gray-900 text-base mb-1">{title}</h4>
          <p className="text-sm text-gray-600 leading-snug">{description}</p>
        </div>
      </div>
       <div className="absolute top-1/2 -translate-y-1/2 right-full w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-white drop-shadow-md"></div>
    </motion.div>
  );
};

export default NavTooltip;
