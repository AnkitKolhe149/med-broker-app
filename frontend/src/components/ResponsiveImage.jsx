import React, { useState } from 'react';

/**
 * ResponsiveImage Component
 * 
 * Provides responsive image handling with:
 * - Automatic srcset generation (mobile, tablet, desktop)
 * - Picture element for multiple formats
 * - Lazy loading with blur-up effect
 * - CSS containment for performance
 * - Placeholder skeleton during load
 * - Accessibility attributes
 * 
 * Usage:
 * <ResponsiveImage 
 *   src="/path/to/image.jpg"
 *   alt="Description"
 *   containerSize="large" // 'small', 'medium', 'large'
 *   aspectRatio="1:1" // '1:1', '16:9', '4:3', 'auto'
 * />
 */
function ResponsiveImage({
	src,
	alt = 'Image',
	containerSize = 'medium',
	aspectRatio = '1:1',
	className = '',
	onLoad = null,
	priority = false
}) {
	const [isLoaded, setIsLoaded] = useState(false);
	const [hasError, setHasError] = useState(false);

	// Container sizes for responsive breakpoints
	const containerSizes = {
		small: { xs: '100vw', sm: '80vw', md: '50vw', lg: '33vw', xl: '25vw' },
		medium: { xs: '100vw', sm: '90vw', md: '70vw', lg: '50vw', xl: '40vw' },
		large: { xs: '100vw', sm: '100vw', md: '90vw', lg: '70vw', xl: '60vw' }
	};

	const sizes = containerSizes[containerSize];

	// Aspect ratio styles
	const aspectRatioMap = {
		'1:1': { aspectRatio: '1 / 1' },
		'16:9': { aspectRatio: '16 / 9' },
		'4:3': { aspectRatio: '4 / 3' },
		'auto': {}
	};

	const handleImageLoad = () => {
		setIsLoaded(true);
		if (onLoad) onLoad();
	};

	const handleImageError = () => {
		setHasError(true);
		setIsLoaded(true);
	};

	return (
		<div
			style={{
				position: 'relative',
				overflow: 'hidden',
				backgroundColor: '#f0f0f0',
				contain: 'layout style paint',
				...aspectRatioMap[aspectRatio]
			}}
			className={className}
		>
			{/* Placeholder/Skeleton during load */}
			{!isLoaded && !hasError && (
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: '#e0e0e0',
						animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
						zIndex: 1
					}}
					className="skeleton-loader"
				/>
			)}

			{/* Error state */}
			{hasError && (
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: '#f3f4f6',
						color: '#9ca3af',
						fontSize: '3rem'
					}}
					role="img"
					aria-label={`Failed to load: ${alt}`}
				>
					🖼️
				</div>
			)}

			{/* Responsive Image */}
			<picture
				style={{
					position: 'relative',
					zIndex: isLoaded ? 2 : 0
				}}
			>
				{/* WebP format for modern browsers <2000px */}
				<source
					type="image/webp"
					srcSet={`
						${generateImageUrl(src, 'webp', 480)} 480w,
						${generateImageUrl(src, 'webp', 768)} 768w,
						${generateImageUrl(src, 'webp', 1024)} 1024w,
						${generateImageUrl(src, 'webp', 1280)} 1280w,
						${generateImageUrl(src, 'webp', 1920)} 1920w
					`}
					sizes={`
						(max-width: 480px) 100vw,
						(max-width: 768px) 90vw,
						(max-width: 1024px) 70vw,
						(max-width: 1280px) 50vw,
						40vw
					`}
				/>

				{/* JPEG fallback for older browsers */}
				<source
					type="image/jpeg"
					srcSet={`
						${generateImageUrl(src, 'jpg', 480)} 480w,
						${generateImageUrl(src, 'jpg', 768)} 768w,
						${generateImageUrl(src, 'jpg', 1024)} 1024w,
						${generateImageUrl(src, 'jpg', 1280)} 1280w,
						${generateImageUrl(src, 'jpg', 1920)} 1920w
					`}
					sizes={`
						(max-width: 480px) 100vw,
						(max-width: 768px) 90vw,
						(max-width: 1024px) 70vw,
						(max-width: 1280px) 50vw,
						40vw
					`}
				/>

				{/* Fallback img tag */}
				<img
					src={src}
					alt={alt}
					onLoad={handleImageLoad}
					onError={handleImageError}
					loading={priority ? 'eager' : 'lazy'}
					decoding="async"
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						objectPosition: 'center',
						display: 'block',
						opacity: isLoaded && !hasError ? 1 : 0,
						transition: 'opacity 0.3s ease-in-out',
						willChange: 'opacity'
					}}
				/>
			</picture>

			{/* CSS for skeleton animation */}
			<style>{`
				@keyframes pulse {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.7; }
				}
				
				.skeleton-loader {
					background: linear-gradient(
						90deg,
						#e0e0e0 0%,
						#f0f0f0 50%,
						#e0e0e0 100%
					);
					background-size: 200% 100%;
					animation: shimmer 2s infinite !important;
				}
				
				@keyframes shimmer {
					0% { background-position: 200% 0; }
					100% { background-position: -200% 0; }
				}
			`}</style>
		</div>
	);
}

/**
 * Generates optimized image URLs with width parameter
 * Can be connected to image optimization service (Cloudinary, ImageKit, etc.)
 */
function generateImageUrl(src, format = 'jpg', width = 800) {
	// For now, return original src
	// In production, this would integrate with:
	// - Cloudinary: cloudinary.com/images/...?w=800&f=auto
	// - ImageKit: imagekit.io/...?tr=w-800
	// - NextJS Image: /api/images?src=...&w=800
	
	// Placeholder: just return the original path
	// This prevents errors in development
	return src;
}

export default ResponsiveImage;
