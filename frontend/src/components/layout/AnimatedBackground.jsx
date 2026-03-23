import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './AnimatedBackground.css';

/**
 * AnimatedBackground Component
 * Creates an interactive, animated medical/pharmacy-themed background
 * - Floating medical icons with smooth animations
 * - Interactive response to user mouse/touch movement
 * - Parallax effect for depth
 * - Non-blocking, accessible background layer
 */
const AnimatedBackground = () => {
	const location = useLocation();
	const canvasRef = useRef(null);
	const particlesRef = useRef([]);
	const mousePos = useRef({ x: 0, y: 0 });
	const animationFrameId = useRef(null);
	const profileRef = useRef(null);

	const getBackgroundProfile = (pathname) => {
		if (pathname === '/') {
			return {
			label: 'landing',
			densityDivisor: 85,
			minParticles: 42,
			sizeMin: 16,
			sizeRange: 16,
			opacityBase: 0.34,
			opacityRange: 0.24,
			maxDistance: 220,
			force: 0.28,
			speedX: 0.4,
			speedY: 0.32,
			gridOpacity: 0.32,
			glowOpacity: 1,
			overlayOpacity: 1,
			borderOpacity: 1,
		};
		}

		if (/\/customer\/(catalog|dashboard|orders|medicine)/.test(pathname)) {
			return {
				label: 'customer-browse',
				densityDivisor: 98,
				minParticles: 34,
				sizeMin: 15,
				sizeRange: 14,
				opacityBase: 0.3,
				opacityRange: 0.2,
				maxDistance: 200,
				force: 0.24,
				speedX: 0.34,
				speedY: 0.28,
				gridOpacity: 0.26,
				glowOpacity: 0.9,
				overlayOpacity: 0.85,
				borderOpacity: 0.82,
			};
		}

		if (/\/vendor\//.test(pathname)) {
			return {
				label: 'vendor',
				densityDivisor: 108,
				minParticles: 28,
				sizeMin: 14,
				sizeRange: 12,
				opacityBase: 0.24,
				opacityRange: 0.17,
				maxDistance: 175,
				force: 0.2,
				speedX: 0.28,
				speedY: 0.22,
				gridOpacity: 0.2,
				glowOpacity: 0.72,
				overlayOpacity: 0.72,
				borderOpacity: 0.68,
			};
		}

		if (/\/(login|register|onboarding|checkout|payment|order-confirmation|profile|admin)/.test(pathname)) {
			return {
				label: 'focused',
				densityDivisor: 126,
				minParticles: 20,
				sizeMin: 13,
				sizeRange: 10,
				opacityBase: 0.18,
				opacityRange: 0.13,
				maxDistance: 150,
				force: 0.14,
				speedX: 0.2,
				speedY: 0.16,
				gridOpacity: 0.12,
				glowOpacity: 0.5,
				overlayOpacity: 0.58,
				borderOpacity: 0.45,
			};
		}

		return {
			label: 'default',
			densityDivisor: 102,
			minParticles: 30,
			sizeMin: 14,
			sizeRange: 13,
			opacityBase: 0.26,
			opacityRange: 0.18,
			maxDistance: 185,
			force: 0.22,
			speedX: 0.3,
			speedY: 0.24,
			gridOpacity: 0.22,
			glowOpacity: 0.78,
			overlayOpacity: 0.78,
			borderOpacity: 0.72,
		};
	};

	// Initialize particles on component mount
	useEffect(() => {
		profileRef.current = getBackgroundProfile(location.pathname);
		const canvas = canvasRef.current;
		if (!canvas) return;

		// Set canvas dimensions
		const resizeCanvas = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};

		resizeCanvas();

		// Create floating particles (medical icons)
		const createParticles = () => {
			const profile = profileRef.current;
			const particleCount = Math.max(profile.minParticles, Math.floor(window.innerWidth / profile.densityDivisor));
			const newParticles = [];
			const kinds = ['dot', 'ring', 'plus'];

			for (let i = 0; i < particleCount; i++) {
				newParticles.push({
					id: i,
					x: Math.random() * canvas.width,
					y: Math.random() * canvas.height,
					vx: (Math.random() - 0.5) * profile.speedX,
					vy: (Math.random() - 0.5) * profile.speedY,
					size: Math.random() * profile.sizeRange + profile.sizeMin,
					opacity: Math.random() * profile.opacityRange + profile.opacityBase,
					kind: kinds[Math.floor(Math.random() * kinds.length)],
					rotation: Math.random() * 360,
					rotationSpeed: (Math.random() - 0.5) * 0.28,
					phase: Math.random() * Math.PI * 2,
				});
			}

			particlesRef.current = newParticles;
		};

		createParticles();

		// Handle window resize
		const handleResize = () => {
			resizeCanvas();
			createParticles();
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, [location.pathname]);

	// Track mouse movement for interactivity
	useEffect(() => {
		const handleMouseMove = (e) => {
			mousePos.current = { x: e.clientX, y: e.clientY };
		};

		const handleTouchMove = (e) => {
			if (e.touches.length > 0) {
				mousePos.current = {
					x: e.touches[0].clientX,
					y: e.touches[0].clientY,
				};
			}
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('touchmove', handleTouchMove);

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('touchmove', handleTouchMove);
		};
	}, []);

	// Animation loop
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const animate = () => {
			const profile = profileRef.current;
			// Clear per frame for a crisp, non-distracting look
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Update and draw particles
			particlesRef.current.forEach((particle) => {
				let newVx = particle.vx;
				let newVy = particle.vy;

				// Interactive force: particles move away from mouse
				const dx = particle.x - mousePos.current.x;
				const dy = particle.y - mousePos.current.y;
				const distance = Math.sqrt(dx * dx + dy * dy);
				const maxDistance = profile.maxDistance;

				if (distance < maxDistance) {
					const angle = Math.atan2(dy, dx);
					const force = (maxDistance - distance) / maxDistance * profile.force;
					newVx += Math.cos(angle) * force;
					newVy += Math.sin(angle) * force;
				}

				// Apply friction/damping
				newVx *= 0.992;
				newVy *= 0.992;

				// Gentle floating wave
				newVy += Math.sin(Date.now() * 0.0008 + particle.phase) * 0.003;

				// Soft wrap-around instead of bounce to avoid visual jitter
				let newX = particle.x + newVx;
				let newY = particle.y + newVy;

				if (newX < -particle.size) {
					newX = canvas.width + particle.size;
				} else if (newX > canvas.width + particle.size) {
					newX = -particle.size;
				}

				if (newY < -particle.size) {
					newY = canvas.height + particle.size;
				} else if (newY > canvas.height + particle.size) {
					newY = -particle.size;
				}

				// Draw particle with calm, geometric primitives
				ctx.save();
				ctx.globalAlpha = particle.opacity;
				ctx.translate(newX, newY);
				ctx.rotate((particle.rotation * Math.PI) / 180);
				ctx.strokeStyle = 'rgba(22, 163, 74, 0.9)';
				ctx.fillStyle = 'rgba(21, 128, 61, 0.58)';
				ctx.lineWidth = 1.35;
				ctx.shadowColor = 'rgba(34, 197, 94, 0.52)';
				ctx.shadowBlur = 8;

				if (particle.kind === 'dot') {
					ctx.beginPath();
					ctx.arc(0, 0, particle.size * 0.34, 0, Math.PI * 2);
					ctx.fill();
					ctx.stroke();
					ctx.closePath();
				} else if (particle.kind === 'ring') {
					ctx.beginPath();
					ctx.arc(0, 0, particle.size * 0.48, 0, Math.PI * 2);
					ctx.stroke();
					ctx.closePath();
				} else {
					const arm = particle.size * 0.45;
					ctx.beginPath();
					ctx.moveTo(-arm, 0);
					ctx.lineTo(arm, 0);
					ctx.moveTo(0, -arm);
					ctx.lineTo(0, arm);
					ctx.stroke();
					ctx.closePath();
				}
				ctx.restore();

				// Update particle properties
				particle.x = newX;
				particle.y = newY;
				particle.vx = newVx;
				particle.vy = newVy;
				particle.rotation = (particle.rotation + particle.rotationSpeed) % 360;
			});

			animationFrameId.current = requestAnimationFrame(animate);
		};

		animate();

		return () => {
			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current);
			}
		};
	}, []);

	const currentProfile = getBackgroundProfile(location.pathname);

	return (
		<div
			className={`animated-background-container page-${currentProfile.label}`}
			style={{
				'--bg-grid-opacity': currentProfile.gridOpacity,
				'--bg-glow-opacity': currentProfile.glowOpacity,
				'--bg-overlay-opacity': currentProfile.overlayOpacity,
				'--bg-border-opacity': currentProfile.borderOpacity,
			}}
		>
			<div className="animated-background-grid" />
			<div className="animated-background-glow" />
			<canvas
				ref={canvasRef}
				className="animated-background-canvas"
				aria-label="Animated medical background"
			/>
			{/* Gradient overlay for visual depth */}
			<div className="animated-background-overlay" />
		</div>
	);
};

export default AnimatedBackground;
