import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design
 * Detects viewport size and provides breakpoint flags
 * 
 * Usage:
 * const { isMobile, isTablet, isDesktop, screenWidth } = useResponsive();
 */
export const useResponsive = () => {
	const [windowWidth, setWindowWidth] = useState(() => {
		if (typeof window === 'undefined') return 1024;
		return window.innerWidth;
	});

	const [isMobile, setIsMobile] = useState(windowWidth < 768);
	const [isTablet, setIsTablet] = useState(windowWidth >= 768 && windowWidth < 1024);
	const [isDesktop, setIsDesktop] = useState(windowWidth >= 1024);
	const [isLandscape, setIsLandscape] = useState(
		typeof window !== 'undefined' && window.innerHeight < window.innerWidth
	);

	useEffect(() => {
		const handleResize = () => {
			const width = window.innerWidth;
			setWindowWidth(width);
			setIsMobile(width < 768);
			setIsTablet(width >= 768 && width < 1024);
			setIsDesktop(width >= 1024);
			setIsLandscape(window.innerHeight < window.innerWidth);
		};

		const handleOrientationChange = () => {
			setTimeout(() => {
				setIsLandscape(window.innerHeight < window.innerWidth);
			}, 100);
		};

		window.addEventListener('resize', handleResize);
		window.addEventListener('orientationchange', handleOrientationChange);

		return () => {
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('orientationchange', handleOrientationChange);
		};
	}, []);

	return {
		screenWidth: windowWidth,
		isMobile,
		isTablet,
		isDesktop,
		isLandscape,
		// Helper flags for common breakpoints
		isSmallMobile: windowWidth < 480,
		isMediumMobile: windowWidth >= 480 && windowWidth < 640,
		isLargeMobile: windowWidth >= 640 && windowWidth < 768,
		// Combined flags
		isMobileOrTablet: windowWidth < 1024,
		isExtraSmall: windowWidth < 360
	};
};

export default useResponsive;
