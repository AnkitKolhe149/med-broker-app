import React from 'react';
import AdminModulePage from './AdminModulePage';

const AdminCatalog = () => (
  <AdminModulePage
    title="Catalog Management"
    description="Manage medicine categories, product metadata, and listing quality across vendors."
    priority="High"
    capabilities={[
      'Category and taxonomy management',
      'Medicine approval workflow',
      'Bulk product import and cleanup',
      'Catalog quality and duplicate detection',
    ]}
  />
);

export default AdminCatalog;
