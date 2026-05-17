const cron = require('node-cron');
const { prisma } = require('../database/prisma');
const { getEnv } = require('../config/env');

const PENDING_ORDER_TTL_MINUTES = Number(getEnv('ORDER_PENDING_TTL_MINUTES', '10'));
const CLEANUP_CRON = getEnv('ORDER_PENDING_CLEANUP_CRON', '*/1 * * * *');
const CLEANUP_TIMEZONE = getEnv('ORDER_PENDING_CLEANUP_TZ', 'Asia/Kolkata');

const runPendingOrderCleanup = async () => {
	const cutoff = new Date(Date.now() - PENDING_ORDER_TTL_MINUTES * 60 * 1000);

	const staleOrders = await prisma.order.findMany({
		where: {
			status: 'PENDING',
			createdAt: { lt: cutoff }
		},
		select: {
			id: true,
			userId: true,
			createdAt: true,
			payment: {
				select: {
					id: true,
					status: true
				}
			}
		},
		orderBy: { createdAt: 'asc' },
		take: 200
	});

	const expirableOrders = staleOrders.filter((order) => !order.payment || order.payment.status !== 'SUCCEEDED');

	if (expirableOrders.length === 0) {
		return { expiredCount: 0 };
	}

	await prisma.$transaction(
		expirableOrders.map((order) => prisma.order.update({
			where: { id: order.id },
			data: {
				status: 'CANCELLED',
				cancelledAt: new Date(),
				cancellationReason: `Pending payment expired after ${PENDING_ORDER_TTL_MINUTES} minutes`,
				adminNote: 'Automatically cancelled because payment was not completed in time.'
			}
		}))
	);

	console.log(`✓ Expired ${expirableOrders.length} pending order(s)`);
	return { expiredCount: expirableOrders.length };
};

const startPendingOrderCleanupScheduler = () => {
	cron.schedule(
		CLEANUP_CRON,
		async () => {
			try {
				await runPendingOrderCleanup();
			} catch (error) {
				console.error('✗ Pending order cleanup failed:', error.message);
			}
		},
		{ timezone: CLEANUP_TIMEZONE }
	);

	runPendingOrderCleanup().catch((error) => {
		console.error('✗ Initial pending order cleanup failed:', error.message);
	});
};

module.exports = { startPendingOrderCleanupScheduler, runPendingOrderCleanup };
