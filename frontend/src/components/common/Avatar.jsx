import React from 'react';

/**
 * Reusable Avatar Component
 * Displays user profile picture or initials fallback
 * 
 * @param {Object} props
 * @param {string} props.src - Profile image URL
 * @param {string} props.name - User's full name (for fallback initials)
 * @param {number} props.size - Avatar size in pixels (default: 60)
 * @param {string} props.className - CSS class name
 * @param {Object} props.style - Inline styles
 */
function Avatar({ src, name = 'User', size = 60, className = '', style = {} }) {
	const [imageError, setImageError] = React.useState(false);

	// Get user initials from name
	const getInitials = (fullName) => {
		if (!fullName) return '?';
		return fullName
			.split(' ')
			.slice(0, 2)
			.map(word => word.charAt(0).toUpperCase())
			.join('');
	};

	const initials = getInitials(name);

	const avatarStyle = {
		width: `${size}px`,
		height: `${size}px`,
		borderRadius: '50%',
		backgroundColor: 'var(--primary, #00A86B)',
		color: 'white',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: `${size / 3}px`,
		fontWeight: '700',
		flexShrink: 0,
		overflow: 'hidden',
		border: '2px solid var(--border)',
		...style
	};

	// If we have a valid image URL and no error, show image
	if (src && !imageError) {
		return (
			<img
				src={src}
				alt={`${name}'s avatar`}
				onError={() => setImageError(true)}
				className={className}
				style={{
					...avatarStyle,
					objectFit: 'cover',
					border: '2px solid var(--border)'
				}}
			/>
		);
	}

	// Fallback to initials
	return (
		<div
			className={className}
			style={avatarStyle}
			title={name}
		>
			{initials}
		</div>
	);
}

export default Avatar;
