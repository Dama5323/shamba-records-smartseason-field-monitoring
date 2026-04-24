// src/components/layout/DashboardLayout.jsx
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = ({ children, user }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />
      
      <main className="flex-1 overflow-y-auto ml-72">
        <Header user={user} />
        <div className="p-8 space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;