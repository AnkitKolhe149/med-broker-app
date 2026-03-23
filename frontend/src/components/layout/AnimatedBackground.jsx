import React, { useEffect, useRef, useState } from 'react';
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
	const canvasRef = useRef(null);
	const [particles, setParticles] = useState([]);
	const mousePos = useRef({ x: 0, y: 0 });
	const animationFrameId = useRef(null);

	// Initialize particles on component mount
	useEffect(() => {
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
			const particleCount = Math.max(15, Math.floor(window.innerWidth / 150));
			const newParticles = [];

			const icons = ['💊', '🧬', '💉', '🩺', '🏥', '⚕️', '🧴', '❤️'];

			for (let i = 0; i < particleCount; i++) {
				newParticles.push({
					id: i,
					x: Math.random() * canvas.width,
					y: Math.random() * canvas.height,
					vx: (Math.random() - 0.5) * 1,
					vy: (Math.random() - 0.5) * 0.5,
					size: Math.random() * 30 + 20,
					opacity: Math.random() * 0.3 + 0.1,
					icon: icons[Math.floor(Math.random() * icons.length)],
					rotation: Math.random() * 360,
					rotationSpeed: (Math.random() - 0.5) * 2,
					density: Math.random() * 0.05 + 0.02,
				});
			}

			setParticles(newParticles);
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
	}, []);

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
		const animate = () => {
			// Clear canvas with semi-transparent background for trail effect
			ctx.fillStyle = 'rgba(245, 251, 247, 0.05)';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Update and draw particles
			setParticles((prevParticles) =>
				prevParticles.map((particle) => {
					let newVx = particle.vx;
					let newVy = particle.vy;

					// Interactive force: particles move away from mouse
					const dx = particle.x - mousePos.current.x;
					const dy = particle.y - mousePos.current.y;
					const distance = Math.sqrt(dx * dx + dy * dy);
					const maxDistance = 150;

					if (distance < maxDistance) {
						const angle = Math.atan2(dy, dx);
						const force = (maxDistance - distance) / maxDistance * 0.3;
						newVx += Math.cos(angle) * force;
						newVy += Math.sin(angle) * force;
					}

					// Apply friction/damping
					newVx *= 0.98;
					newVy *= 0.98;

					// Add slight gravitational drift
					newVy += 0.1;

					// Wall bouncing with energy loss
					let newX = particle.x + newVx;
					let newY = particle.y + newVy;

					if (newX - particle.size / 2 < 0 || newX + particle.size / 2 > canvas.width) {
						newVx *= -0.8;
						newX = newX < 0 ? particle.size / 2 : canvas.width - particle.size / 2;
					}

					if (newY - particle.size / 2 < 0 || newY + particle.size / 2 > canvas.height) {
						newVy *= -0.8;
						newY = newY < 0 ? particle.size / 2 : canvas.height - particle.size / 2;
					}

					// Draw particle
					ctx.save();
					ctx.globalAlpha = particle.opacity;
					ctx.translate(newX, newY);
					ctx.rotate((particle.rotation * Math.PI) / 180);
					ctx.font = `${particle.size}px Arial`;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText(particle.icon, 0, 0);
					ctx.restore();

					return {
						...particle,
						x: newX,
						y: newY,
						vx: newVx,
						vy: newVy,
						rotation:
							(particle.rotation + particle.rotationSpeed) % 360,
					};
				})
			);

			animationFrameId.current = requestAnimationFrame(animate);
		};

		animate();

		return () => {
			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current);
			}
		};
	}, []);

	return (
		<div className="animated-background-container">
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
