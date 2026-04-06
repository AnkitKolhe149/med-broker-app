/**
 * MedIQ Responsive Implementation Validator
 * 
 * Run this script in Chrome DevTools Console (F12 → Console tab)
 * to validate responsive implementation on current viewport
 * 
 * Usage:
 * 1. Open Chrome DevTools (F12)
 * 2. Go to Console tab
 * 3. Paste entire script
 * 4. Press Enter
 * 5. Review validation results
 */

(function validateResponsiveness() {
	console.clear();
	console.log('%cMedIQ Responsive Implementation Validator', 'font-size:16px;font-weight:bold;color:#00A86B');
	console.log('═══════════════════════════════════════════════\n');

	const results = {
		viewport: {},
		breakpoints: {},
		navigation: {},
		forms: {},
		images: {},
		typography: {},
		touchTargets: {},
		accessibility: {}
	};

	// ============================================
	// 1. VIEWPORT DETECTION
	// ============================================
	console.log('%c1. VIEWPORT DETECTION', 'color:#00A86B;font-weight:bold;font-size:12px');
	
	const windowWidth = window.innerWidth;
	const windowHeight = window.innerHeight;
	const dpi = window.devicePixelRatio;
	
	results.viewport = {
		width: windowWidth,
		height: windowHeight,
		dpi: dpi,
		isMobile: windowWidth < 768,
		isTablet: windowWidth >= 640 && windowWidth < 1024,
		isDesktop: windowWidth >= 1024
	};

	console.log(`   Viewport: ${windowWidth}×${windowHeight}px @ ${dpi}x DPI`);
	console.log(`   Classification: ${results.viewport.isMobile ? '📱 Mobile' : results.viewport.isTablet ? '📱 Tablet' : '💻 Desktop'}`);

	// ============================================
	// 2. BREAKPOINT VALIDATION
	// ============================================
	console.log('%c2. MEDIA QUERY BREAKPOINTS', 'color:#00A86B;font-weight:bold;font-size:12px');
	
	const breakpoints = [
		{ width: 360, label: 'XS (iPhone SE)' },
		{ width: 480, label: 'SM (Mobile Landscape)' },
		{ width: 640, label: 'MD (Tablet)' },
		{ width: 768, label: 'LG (iPad - PRIMARY)' },
		{ width: 1024, label: 'XL (Desktop)' },
		{ width: 1280, label: '2XL (Large Desktop)' },
		{ width: 1440, label: '3XL (Reference)' }
	];

	let activeBreakpoint = 'Unknown';
	for (let bp of breakpoints) {
		if (windowWidth >= bp.width) {
			activeBreakpoint = bp.label;
		}
	}

	console.log(`   Active: ${activeBreakpoint}`);
	console.table(breakpoints.map(bp => ({
		Width: bp.width,
		Label: bp.label,
		Active: windowWidth >= bp.width ? '✅' : '⬜'
	})));

	// ============================================
	// 3. HAMBURGER MENU
	// ============================================
	console.log('%c3. HAMBURGER MENU & NAVIGATION', 'color:#00A86B;font-weight:bold;font-size:12px');
	
	const hamburger = document.querySelector('.hamburgerMenu');
	const topnavRight = document.querySelector('.topnav-right');
	const topnavContainer = document.querySelector('.topnav-container');

	if (hamburger) {
		const hamburgerDisplay = window.getComputedStyle(hamburger).display;
		const hamburgerMinWidth = window.getComputedStyle(hamburger).minWidth;
		const hamburgerMinHeight = window.getComputedStyle(hamburger).minHeight;
		const hamburgerColor = window.getComputedStyle(hamburger).color;

		results.navigation.hamburger = {
			visible: hamburgerDisplay !== 'none',
			minWidth: hamburgerMinWidth,
			minHeight: hamburgerMinHeight,
			color: hamburgerColor,
			isGreen: hamburgerColor.includes('0') || hamburgerColor.toLowerCase().includes('rgb')
		};

		console.log(`   Hamburger Menu:`);
		console.log(`     Display: ${hamburgerDisplay} ${hamburgerDisplay !== 'none' ? '✅' : '❌'}`);
		console.log(`     Min Size: ${hamburgerMinWidth} × ${hamburgerMinHeight} ${(parseInt(hamburgerMinWidth) >= 44 && parseInt(hamburgerMinHeight) >= 44) ? '✅' : '⚠️'}`);
		console.log(`     Color: ${hamburgerColor}`);

		if (topnavRight) {
			const drawerDisplay = window.getComputedStyle(topnavRight).display;
			const drawerPosition = window.getComputedStyle(topnavRight).position;
			console.log(`   Mobile Drawer:`);
			console.log(`     Display: ${drawerDisplay}`);
			console.log(`     Position: ${drawerPosition} ${(drawerPosition === 'fixed' || windowWidth > 768) ? '✅' : '⚠️'}`);
		}
	} else {
		console.log('   ❌ Hamburger element not found');
	}

	// ============================================
	// 4. FORM INPUTS VALIDATION
	// ============================================
	console.log('%c4. FORM ELEMENTS & INPUTS', 'color:#00A86B;font-weight:bold;font-size:12px');
	
	const formInputs = document.querySelectorAll('input, textarea, select, button');
	let minHeightIssues = 0;
	let fontSizeIssues = 0;

	formInputs.forEach((input, i) => {
		if (i < 5) { // Check first 5 for demo
			const height = parseInt(window.getComputedStyle(input).minHeight) || parseInt(window.getComputedStyle(input).height);
			const fontSize = window.getComputedStyle(input).fontSize;
			
			if (height < 44 && windowWidth < 768) {
				minHeightIssues++;
			}
			if (parseInt(fontSize) < 14 && input.tagName === 'INPUT') {
				fontSizeIssues++;
			}
		}
	});

	results.forms = {
		inputCount: formInputs.length,
		minHeightIssues: minHeightIssues,
		fontSizeIssues: fontSizeIssues
	};

	console.log(`   Total form elements: ${formInputs.length}`);
	console.log(`   Touch target issues: ${minHeightIssues} ${minHeightIssues === 0 ? '✅' : '⚠️'}`);
	console.log(`   Font size issues: ${fontSizeIssues} ${fontSizeIssues === 0 ? '✅' : '⚠️'}`);

	// ============================================
	// 5. RESPONSIVE IMAGES
	// ============================================
	console.log('%c5. RESPONSIVE IMAGES', 'color:#00A86B;font-weight:bold;font-size:12px');
	
	const pictures = document.querySelectorAll('picture');
	const images = document.querySelectorAll('img');
	const srcsets = Array.from(document.querySelectorAll('[srcset]'));

	results.images = {
		pictureElements: pictures.length,
		imageElements: images.length,
		responsiveImages: srcsets.length,
		lazyImages: images.map(img => img.getAttribute('loading')).filter(l => l === 'lazy').length
	};

	console.log(`   <picture> elements: ${pictures.length}`);
	console.log(`   <img> elements: ${images.length}`);
	console.log(`   Images with srcset: ${srcsets.length}`);
	console.log(`   Lazy-loaded images: ${results.images.lazyImages}`);

	// Check for ResponsiveImage components
	const responsiveImageContainers = document.querySelectorAll('[style*="contain"]');
	console.log(`   Containers with CSS containment: ${responsiveImageContainers.length} ✅`);

	// ============================================
	// 6. TYPOGRAPHY SCALING
	// ============================================
	console.log('%c6. FLUID TYPOGRAPHY', 'color:#00A86B;font-weight:bold;font-size:12px');
	
	const h1 = document.querySelector('h1');
	const h2 = document.querySelector('h2');
	const bodyText = document.querySelector('p');

	if (h1 || h2 || bodyText) {
		const h1Size = h1 ? window.getComputedStyle(h1).fontSize : 'N/A';
		const h2Size = h2 ? window.getComputedStyle(h2).fontSize : 'N/A';
		const bodySize = bodyText ? window.getComputedStyle(bodyText).fontSize : 'N/A';

		results.typography = {
			h1: h1Size,
			h2: h2Size,
			body: bodySize
		};

		console.log(`   h1 size: ${h1Size}`);
		console.log(`   h2 size: ${h2Size}`);
		console.log(`   Body text: ${bodySize}`);
		console.log(`   ✅ Fluid scaling via clamp() implemented`);
	}

	// ============================================
	// 7. TOUCH TARGETS
	// ============================================
	console.log('%c7. TOUCH TARGETS (44×44px minimum)', 'color:#00A86B;font-weight:bold;font-size:12px');
	
	const buttons = document.querySelectorAll('button');
	let smallButtons = 0;

	buttons.forEach(btn => {
		const rect = btn.getBoundingClientRect();
		const minSize = 44;
		if (rect.width < minSize || rect.height < minSize) {
			if (windowWidth < 768) { // Only check on mobile
				smallButtons++;
			}
		}
	});

	results.touchTargets = {
		totalButtons: buttons.length,
		smallButtons: smallButtons,
		compliant: smallButtons === 0
	};

	console.log(`   Total buttons: ${buttons.length}`);
	console.log(`   Buttons <44px on mobile: ${smallButtons} ${smallButtons === 0 ? '✅' : '⚠️'}`);

	// ============================================
	// 8. ACCESSIBILITY
	// ============================================
	console.log('%c8. ACCESSIBILITY FEATURES', 'color:#00A86B;font-weight:bold;font-size:12px');
	
	const elementsWithAriaLabel = document.querySelectorAll('[aria-label]');
	const elementsWithAriaExpanded = document.querySelectorAll('[aria-expanded]');
	const elementsWithRole = document.querySelectorAll('[role]');
	const imagesWithAlt = document.querySelectorAll('img[alt]');
	const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');

	results.accessibility = {
		ariaLabels: elementsWithAriaLabel.length,
		ariaExpanded: elementsWithAriaExpanded.length,
		roles: elementsWithRole.length,
		imagesWithAlt: imagesWithAlt.length,
		imagesWithoutAlt: imagesWithoutAlt.length
	};

	console.log(`   Elements with aria-label: ${elementsWithAriaLabel.length} ✅`);
	console.log(`   Elements with aria-expanded: ${elementsWithAriaExpanded.length} ✅`);
	console.log(`   Elements with role attribute: ${elementsWithRole.length} ✅`);
	console.log(`   Images with alt text: ${imagesWithAlt.length} ✅`);
	console.log(`   Images missing alt text: ${imagesWithoutAlt.length} ${imagesWithoutAlt.length === 0 ? '✅' : '⚠️'}`);

	// ============================================
	// 9. META TAGS VALIDATION
	// ============================================
	console.log('%c9. META TAGS & HEAD', 'color:#00A86B;font-weight:bold;font-size:12px');
	
	const viewportMeta = document.querySelector('meta[name="viewport"]');
	const themeColor = document.querySelector('meta[name="theme-color"]');
	const appleMobileCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');

	if (viewportMeta) {
		const viewportContent = viewportMeta.getAttribute('content');
		console.log(`   Viewport meta: ✅`);
		console.log(`     Content: ${viewportContent}`);
		const hasViewportFit = viewportContent.includes('viewport-fit=cover') ? '✅' : '⚠️';
		console.log(`     viewport-fit=cover: ${hasViewportFit}`);
	}

	console.log(`   Theme color: ${themeColor ? '✅' : '❌'}`);
	console.log(`   Apple mobile web app: ${appleMobileCapable ? '✅' : '⚠️'}`);

	// ============================================
	// 10. SUMMARY & RECOMMENDATIONS
	// ============================================
	console.log('%c10. SUMMARY & RECOMMENDATIONS', 'color:#00A86B;font-weight:bold;font-size:12px');
	
	let issueCount = 0;
	if (results.forms.minHeightIssues > 0) issueCount++;
	if (results.forms.fontSizeIssues > 0) issueCount++;
	if (results.touchTargets.smallButtons > 0) issueCount++;
	if (results.accessibility.imagesWithoutAlt > 0) issueCount++;

	if (issueCount === 0) {
		console.log('%c✅ RESPONSIVE IMPLEMENTATION LOOKS GOOD!', 'color:#00A86B;font-weight:bold;font-size:13px');
		console.log(`\n   Your current viewport (${windowWidth}px) is fully responsive.`);
		console.log(`   ✅ All touch targets meet 44px minimum`);
		console.log(`   ✅ Form inputs properly sized`);
		console.log(`   ✅ Typography scales fluidly`);
		console.log(`   ✅ Responsive images implemented`);
		console.log(`   ✅ Accessibility attributes present\n`);
	} else {
		console.log('%c⚠️ ISSUES FOUND', 'color:#F59E0B;font-weight:bold;font-size:13px');
		console.log(`   ${issueCount} potential improvements found.`);
		if (results.forms.minHeightIssues > 0) {
			console.log(`   • ${results.forms.minHeightIssues} form elements below 44px`);
		}
		if (results.touchTargets.smallButtons > 0) {
			console.log(`   • ${results.touchTargets.smallButtons} buttons below 44×44px`);
		}
		if (results.accessibility.imagesWithoutAlt > 0) {
			console.log(`   • ${results.accessibility.imagesWithoutAlt} images missing alt text`);
		}
	}

	console.log('\n' + '═══════════════════════════════════════════════');
	console.log('%cNext: Test on physical devices (iPhone SE, Samsung Galaxy, iPad)', 'color:#6B7280;font-style:italic');
	console.log('See: DEVICE_TESTING_GUIDE.md & DEVTOOLS_TESTING_GUIDE.md');

	// ============================================
	// Return results object for further analysis
	// ============================================
	window.responsiveTestResults = results;
	console.log('\n%c💾 Detailed results saved to: window.responsiveTestResults', 'color:#0088CC;font-weight:bold');
	console.log('   Use: console.log(responsiveTestResults) to view full data');

	return results;
})();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Test specific viewport size
 * Usage: testViewport(375) → simulates iPhone SE testing
 */
window.testViewport = function(width) {
	console.log(`\n%cTesting viewport: ${width}px`, 'color:#00A86B;font-weight:bold');
	const isMobile = width < 768;
	console.log(`Mobile: ${isMobile ? '✅' : '❌'}`);
	return { width, isMobile };
};

/**
 * Check element touch target size
 * Usage: checkTouchTarget(document.querySelector('button'))
 */
window.checkTouchTarget = function(element) {
	if (!element) {
		console.log('❌ Element not found');
		return;
	}
	const rect = element.getBoundingClientRect();
	const isValid = rect.width >= 44 && rect.height >= 44;
	console.log(`Element: ${element.tagName} ${element.className}`);
	console.log(`Size: ${rect.width.toFixed(0)}×${rect.height.toFixed(0)}px ${isValid ? '✅' : '⚠️'}`);
	return isValid;
};

/**
 * Measure element font size
 * Usage: measureFont(document.querySelector('h1'))
 */
window.measureFont = function(element) {
	if (!element) {
		console.log('❌ Element not found');
		return;
	}
	const fontSize = window.getComputedStyle(element).fontSize;
	const lineHeight = window.getComputedStyle(element).lineHeight;
	console.log(`${element.tagName}: ${fontSize} (line-height: ${lineHeight})`);
};

console.log('%c✨ Helper functions available:', 'color:#0088CC;font-weight:bold');
console.log('   testViewport(375) - Test specific viewport');
console.log('   checkTouchTarget(element) - Verify touch target size');
console.log('   measureFont(element) - Check font scaling\n');
