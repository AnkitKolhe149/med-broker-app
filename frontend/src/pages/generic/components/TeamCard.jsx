import React from 'react';
import ResponsiveImage from './ResponsiveImage';
import styles from './TeamCard.module.css';

/**
 * TeamCard Component
 * 
 * Displays team member information with responsive image
 * Used in About page
 */
function TeamCard({ image, name, role }) {
	const [isHovered, setIsHovered] = React.useState(false);

	return (
		<div
			className={styles.card}
			style={isHovered ? { transform: 'translateY(-4px)', boxShadow: 'var(--shadow-lg)' } : undefined}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Image Container - 1:1 Aspect Ratio */}
			<div className={styles.imageContainer}>
				<ResponsiveImage
					src={image}
					alt={name}
					containerSize="medium"
					aspectRatio="1:1"
					priority={false}
				/>
			</div>

			{/* Info Section */}
			<div className={styles.infoSection}>
				<h3 className={styles.name}>{name}</h3>
				<p className={styles.role}>{role}</p>
			</div>
		</div>
	);
}

export default TeamCard;
