const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  
  // 1. Create User
  const user = await prisma.user.create({
    data: {
      email: 'vendor@test.com',
      passwordHash: hash,
      role: 'VENDOR',
      name: 'Test Vendor',
      mobile: '+919876543210',
      isProfileComplete: true
    }
  });

  // 2. Create Vendor Profile
  await prisma.vendor.create({
    data: {
      userId: user.id,
      companyName: 'MedTech Supplies Ltd',
      vendorType: 'DISTRIBUTOR',
      country: 'India',
      state: 'Maharashtra',
      gstinNumber: '27AABCU9603R1ZM',
      drugLicenseNumber: 'MH-MZ4-112233',
      businessAddress: '42 Pharma Parkway, Andheri East, Mumbai',
      contactPersonName: 'Raj Vendor',
      contactNumber: '+919876543210',
      verificationStatus: 'PENDING'
    }
  });

  console.log('Vendor successfully created: vendor@test.com / password123');
}

main().catch(e => {
  console.log("Error creating vendor. If they already exist, we ignore this:", e.message);
}).finally(() => prisma.$disconnect());
