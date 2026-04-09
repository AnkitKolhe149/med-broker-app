import React from 'react';
import AdminModulePage from './AdminModulePage';

const AdminSettings = () => (
  <AdminModulePage
    title="System Settings"
    description="Control global platform behavior, governance defaults, and operational safeguards."
    priority="Medium"
    capabilities={[
      'Feature flags and rollout controls',
      'Role and permission guardrails',
      'Tax and pricing defaults',
      'Operational limits and alerts',
    ]}
  />
);

export default AdminSettings;
