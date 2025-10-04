// This component is deprecated and will be removed.
// The new collaboration management is handled by the CollaboratorsPage and UserManagementView.
import React from 'react';

const ShareProjectDrawer = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white h-full p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Share Project (Deprecated)</h2>
        <p>This feature has been moved to a dedicated page.</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ShareProjectDrawer;
