import React from 'react';
import './VendorPageShell.css';

function VendorPageShell({ title, subtitle, actions, children, compact = false }) {
	return (
		<section className={`vendor-page-shell ${compact ? 'compact' : ''}`}>
			<div className="vendor-page-shell-header">
				<div className="vendor-page-shell-heading">
					<h1 className="vendor-page-shell-title">{title}</h1>
					{subtitle && <p className="vendor-page-shell-subtitle">{subtitle}</p>}
				</div>
				{actions ? <div className="vendor-page-shell-actions">{actions}</div> : null}
			</div>
			<div className="vendor-page-shell-content">{children}</div>
		</section>
	);
}

export default VendorPageShell;
