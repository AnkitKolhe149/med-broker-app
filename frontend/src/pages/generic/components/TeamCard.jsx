import React from 'react';
import ResponsiveImage from './ResponsiveImage';

/**
 * TeamCard Component
 * 
 * Displays team member information with responsive image
 * Used in About page
 */
function TeamCard({ image, name, role }) {
	const styles = {
		card: {
			display: 'flex',
			flexDirection: 'column',
			borderRadius: 'var(--radius-lg)',
			overflow: 'hidden',
			backgroundColor: 'white',
			boxShadow: 'var(--shadow-md)',
			transition: 'transform 0.3s ease, box-shadow 0.3s ease',
			cursor: 'pointer',
			minWidth: 0 // Prevents flex overflow
		},
		cardHover: {
			transform: 'translateY(-4px)',
			boxShadow: 'var(--shadow-lg)'
		},
		imageContainer: {
			width: '100%',
			backgroundColor: '#f0f0f0',
			overflow: 'hidden',
			contain: 'layout style paint'
		},
		infoSection: {
			padding: '1.5rem',
			flex: 1,
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-between'
		},
		name: {
			fontSize: '1.125rem',
			fontWeight: '700',
			color: 'var(--text-primary)',
			margin: '0 0 0.5rem 0'
		},
		role: {
			fontSize: '0.875rem',
			color: 'var(--text-secondary)',
			margin: 0
		}
	};

	const [isHovered, setIsHovered] = React.useState(false);

	return (
		<div
			style={{
				...styles.card,
				...(isHovered ? styles.cardHover : {})
			}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Image Container - 1:1 Aspect Ratio */}
			<div style={styles.imageContainer}>
				<ResponsiveImage
					src={image}
					alt={name}
					containerSize="medium"
					aspectRatio="1:1"
					priority={false}
				/>
			</div>

			{/* Info Section */}
			<div style={styles.infoSection}>
				<h3 style={styles.name}>{name}</h3>
				<p style={styles.role}>{role}</p>
			</div>
		</div>
	);
}

export default TeamCard;
