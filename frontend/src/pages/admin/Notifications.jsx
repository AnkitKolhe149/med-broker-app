import React from 'react';
import AdminModulePage from './AdminModulePage';

const AdminNotifications = () => (
  <AdminModulePage
    title="Notification Center"
    description="Manage platform messaging templates and delivery controls across channels."
    priority="Medium"
    capabilities={[
      'Email/SMS/push templates',
      'Campaign and trigger mapping',
      'Delivery health and retries',
      'Audience targeting controls',
    ]}
  />
);

export default AdminNotifications;
