import React from 'react';
import AdminModulePage from './AdminModulePage';

const AdminCompliance = () => (
  <AdminModulePage
    title="Compliance & Audit"
    description="Ensure regulatory readiness with complete audit visibility and policy controls."
    priority="High"
    capabilities={[
      'KYC and license status overview',
      'Audit log review and export',
      'Policy adherence dashboard',
      'Regulatory evidence snapshots',
    ]}
  />
);

export default AdminCompliance;
