import React from 'react';
import AdminModulePage from './AdminModulePage';

const AdminInventory = () => (
  <AdminModulePage
    title="Inventory Management"
    description="Track inventory health, low stock alerts, and batch/expiry integrity platform-wide."
    priority="High"
    capabilities={[
      'Stock visibility across vendors',
      'Expiry and batch tracking',
      'Low stock and stockout alerts',
      'Inventory discrepancy monitoring',
    ]}
  />
);

export default AdminInventory;
