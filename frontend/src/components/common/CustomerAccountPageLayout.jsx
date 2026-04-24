import React from 'react';
import CustomerAccountSidebar from './CustomerAccountSidebar';
import styles from './CustomerAccountPageLayout.module.css';

function CustomerAccountPageLayout({
  user,
  activeItem,
  hiddenItemKeys,
  title,
  subtitle,
  children
}) {
  return (
    <main className="page">
      <div className="container">
        <div className={styles.pageGrid}>
          <CustomerAccountSidebar user={user} activeItem={activeItem} hiddenItemKeys={hiddenItemKeys} />

          <section className={styles.contentPanel}>
            {title ? <h1 className={styles.pageTitle}>{title}</h1> : null}
            {subtitle ? <p className={styles.pageSubtitle}>{subtitle}</p> : null}
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}

export default CustomerAccountPageLayout;
