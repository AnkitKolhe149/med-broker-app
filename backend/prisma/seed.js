const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
	console.log('🌱 Starting comprehensive database seed...\n');

	// Clear existing data (in correct dependency order)
	console.log('🧹 Clearing existing data...');
	await prisma.orderItem.deleteMany({});
	await prisma.payment.deleteMany({});
	await prisma.invoice.deleteMany({});
	await prisma.order.deleteMany({});
	await prisma.inventory.deleteMany({});
	await prisma.medicine.deleteMany({});
	await prisma.customer.deleteMany({});
	await prisma.vendor.deleteMany({});
	await prisma.user.deleteMany({});

	// Create admin user
	console.log('\n👤 Creating admin user...');
	const adminUser = await prisma.user.create({
		data: {
			email: 'admin@medbroker.com',
			mobile: '+91-9876543210',
			name: 'Admin User',
			passwordHash: await bcryptjs.hash('admin123', 10),
			role: 'ADMIN',
			isProfileComplete: true
		}
	});
	console.log(`✓ Admin: ${adminUser.email}`);

	// Create vendor users and profiles
	console.log('\n🏢 Creating vendor users and profiles...');
	const vendorsList = [
		{
			name: 'PharmaCorp India',
			email: 'vendor1@medbroker.com',
			gstinNumber: '18AABJU5055R1Z0',
			drugLicenseNumber: 'DL-2024-001',
			country: 'India',
			state: 'Maharashtra'
		},
		{
			name: 'HealthPlus Pharma',
			email: 'vendor2@medbroker.com',
			gstinNumber: '27AABCU9603R1Z5',
			drugLicenseNumber: 'DL-2024-002',
			country: 'India',
			state: 'Karnataka'
		},
		{
			name: 'MediCare Solutions',
			email: 'vendor3@medbroker.com',
			gstinNumber: '06AABCS7854R1Z3',
			drugLicenseNumber: 'DL-2024-003',
			country: 'India',
			state: 'Delhi'
		}
	];

	const vendorProfiles = [];
	for (const vendor of vendorsList) {
		const vendorUser = await prisma.user.create({
			data: {
				email: vendor.email,
				mobile: `+91-988000${vendorProfiles.length}000`,
				name: vendor.name,
				passwordHash: await bcryptjs.hash('vendor123', 10),
				role: 'VENDOR',
				isProfileComplete: true
			}
		});

		const vendorProfile = await prisma.vendor.create({
			data: {
				userId: vendorUser.id,
				companyName: vendor.name,
				vendorType: 'PHARMACY',
				country: vendor.country,
				state: vendor.state,
				gstinNumber: vendor.gstinNumber,
				drugLicenseNumber: vendor.drugLicenseNumber,
				businessAddress: `${vendor.state}, ${vendor.country}`,
				contactPersonName: vendor.name,
				contactNumber: `+91-988000${vendorProfiles.length}000`,
				verificationStatus: 'VERIFIED'
			}
		});

		vendorProfiles.push(vendorProfile);
		console.log(`✓ ${vendor.name} (${vendorProfile.id})`);
	}

	// Create medicines
	const dummyMedicines = [
		{
			name: 'Paracetamol 500mg',
			description: 'Pain reliever and fever reducer. Effective for headaches, muscle aches, and mild arthritis.',
			priceCents: 4500 // ₹45.00
		},
		{
			name: 'Amoxicillin 250mg',
			description: 'Antibiotic for bacterial infections. Used for ear, nose, throat, urinary tract and skin infections.',
			priceCents: 6000
		},
		{
			name: 'Cetirizine 10mg',
			description: 'Antihistamine for allergy relief. Reduces sneezing, itching, watery eyes and runny nose.',
			priceCents: 3500
		},
		{
			name: 'Omeprazole 20mg',
			description: 'Reduces stomach acid. Used for heartburn, GERD, and ulcer treatment.',
			priceCents: 8500
		},
		{
			name: 'Metformin 500mg',
			description: 'Diabetes medication. Helps control blood sugar levels in type 2 diabetes.',
			priceCents: 5000
		},
		{
			name: 'Atorvastatin 10mg',
			description: 'Cholesterol-lowering statin. Reduces risk of heart disease and stroke.',
			priceCents: 9500
		},
		{
			name: 'Aspirin 75mg',
			description: 'Blood thinner for heart attack and stroke prevention.',
			priceCents: 2500
		},
		{
			name: 'Lisinopril 10mg',
			description: 'ACE inhibitor for high blood pressure and heart failure management.',
			priceCents: 7000
		},
		{
			name: 'Levothyroxine 50mcg',
			description: 'Thyroid hormone replacement for hypothyroidism treatment.',
			priceCents: 4500
		},
		{
			name: 'Vitamin B12 500mcg',
			description: 'Vitamin supplement for energy, nerve function, and red blood cell formation.',
			priceCents: 3000
		},
		{
			name: 'Ibuprofen 400mg',
			description: 'Anti-inflammatory pain reliever for arthritis, menstrual cramps, and pain relief.',
			priceCents: 4000
		},
		{
			name: 'Ranitidine 150mg',
			description: 'Histamine-2 blocker for acid reflux and stomach ulcers.',
			priceCents: 5500
		},
		{
			name: 'Fluoxetine 20mg',
			description: 'SSRI antidepressant for depression, anxiety, OCD, and panic disorder treatment.',
			priceCents: 12000
		},
		{
			name: 'Losartan 50mg',
			description: 'Angiotensin receptor blocker for hypertension management.',
			priceCents: 8000
		},
		{
			name: 'Gabapentin 300mg',
			description: 'Anti-seizure and neuropathic pain medication.',
			priceCents: 6500
		},
		{
			name: 'Ciprofloxacin 500mg',
			description: 'Fluoroquinolone antibiotic for bacterial urinary tract and respiratory infections.',
			priceCents: 7500
		},
		{
			name: 'Metoprolol 25mg',
			description: 'Beta-blocker for high blood pressure and angina treatment.',
			priceCents: 6000
		},
		{
			name: 'Sodium Bicarbonate 500mg',
			description: 'Antacid for heartburn relief and urine alkalinization.',
			priceCents: 2000
		},
		{
			name: 'Dextromethorphan 10mg',
			description: 'Cough suppressant for dry coughs and cold symptoms.',
			priceCents: 3500
		},
		{
			name: 'Amlodipine 5mg',
			description: 'Calcium channel blocker for hypertension and angina management.',
			priceCents: 7000
		}
	];

	console.log(`\n💊 Creating ${dummyMedicines.length} medicines...`);
	const createdMedicines = [];
	for (const medicine of dummyMedicines) {
		const created = await prisma.medicine.create({
			data: medicine
		});
		createdMedicines.push(created);
		console.log(`✓ ${created.name}`);
	}

	// Create inventory entries linking medicines to vendors
	console.log(`\n📦 Creating inventory entries...`);
	let inventoryCount = 0;
	for (let i = 0; i < createdMedicines.length; i++) {
		const medicine = createdMedicines[i];
		// Assign each medicine to 1-2 random vendors
		const vendorCount = Math.random() > 0.5 ? 2 : 1;
		const selectedVendors = [];

		while (selectedVendors.length < vendorCount) {
			const randomVendor = vendorProfiles[Math.floor(Math.random() * vendorProfiles.length)];
			if (!selectedVendors.find(v => v.id === randomVendor.id)) {
				selectedVendors.push(randomVendor);
			}
		}

		for (const vendor of selectedVendors) {
			const quantity = Math.floor(Math.random() * 400) + 50; // 50-450 units
			await prisma.inventory.create({
				data: {
					medicineId: medicine.id,
					vendorId: vendor.id,
					quantity
				}
			});
			inventoryCount++;
			console.log(`✓ ${medicine.name} → ${vendor.companyName} (${quantity} units)`);
		}
	}

	// Create sample customer user
	console.log('\n👥 Creating sample customer user...');
	const customerUser = await prisma.user.create({
		data: {
			email: 'customer@medbroker.com',
			mobile: '+91-9123456789',
			name: 'John Doe',
			passwordHash: await bcryptjs.hash('customer123', 10),
			role: 'CUSTOMER',
			isProfileComplete: true
		}
	});

	const customerProfile = await prisma.customer.create({
		data: {
			userId: customerUser.id,
			fullName: 'John Doe',
			buyerType: 'RETAIL',
			country: 'India',
			city: 'Mumbai',
			deliveryAddress: 'Mumbai, India',
			contactNumber: '+91-9123456789'
		}
	});
	console.log(`✓ ${customerProfile.fullName} (${customerUser.email})`);

	console.log('\n✅ Database seed completed successfully!');
	console.log(`\n📊 Summary:`);
	console.log(`  • Vendors: ${vendorProfiles.length}`);
	console.log(`  • Medicines: ${createdMedicines.length}`);
	console.log(`  • Inventory entries: ${inventoryCount}`);
	console.log(`  • Users: ${3 + vendorProfiles.length} (Admin + Vendors + Customer)`);
}

main()
	.catch((e) => {
		console.error('❌ Seed failed:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
