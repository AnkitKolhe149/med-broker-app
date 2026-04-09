require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PASSWORD_PLAIN = 'Mediq@12345';

const adminUsers = [
  {
    email: 'admin.operations@mediq.com',
    mobile: '9000001001',
    name: 'Operations Admin'
  },
  {
    email: 'admin.finance@mediq.com',
    mobile: '9000001002',
    name: 'Finance Admin'
  }
];

const vendorUsers = [
  {
    email: 'vendor.apollo@mediq.com',
    mobile: '9000002001',
    name: 'Apollo Vendor Owner',
    vendor: {
      companyName: 'Apollo Med Supplies',
      vendorType: 'DISTRIBUTOR',
      country: 'India',
      state: 'Maharashtra',
      gstinNumber: '27ABCDE1234F1Z5',
      drugLicenseNumber: 'DL-MH-0001',
      businessAddress: 'Andheri East, Mumbai',
      contactPersonName: 'Aarav Mehta',
      contactNumber: '9000002001',
      verificationStatus: 'VERIFIED'
    }
  },
  {
    email: 'vendor.careplus@mediq.com',
    mobile: '9000002002',
    name: 'CarePlus Vendor Owner',
    vendor: {
      companyName: 'CarePlus Pharma Trade',
      vendorType: 'PHARMACY',
      country: 'India',
      state: 'Karnataka',
      gstinNumber: '29FGHIJ5678K2Z6',
      drugLicenseNumber: 'DL-KA-0002',
      businessAddress: 'Indiranagar, Bengaluru',
      contactPersonName: 'Nisha Rao',
      contactNumber: '9000002002',
      verificationStatus: 'VERIFIED'
    }
  },
  {
    email: 'vendor.biolife@mediq.com',
    mobile: '9000002003',
    name: 'BioLife Vendor Owner',
    vendor: {
      companyName: 'BioLife Manufacturers',
      vendorType: 'MANUFACTURER',
      country: 'India',
      state: 'Gujarat',
      gstinNumber: '24KLMNO9012P3Z7',
      drugLicenseNumber: 'DL-GJ-0003',
      businessAddress: 'Satellite, Ahmedabad',
      contactPersonName: 'Rohan Shah',
      contactNumber: '9000002003',
      verificationStatus: 'VERIFIED'
    }
  }
];

const customerUsers = [
  {
    email: 'customer.retail1@mediq.com',
    mobile: '9000003001',
    name: 'Retail Customer One',
    customer: {
      fullName: 'Retail Customer One',
      buyerType: 'RETAIL',
      businessName: null,
      gstin: null,
      country: 'India',
      city: 'Mumbai',
      deliveryAddress: 'Powai, Mumbai',
      contactNumber: '9000003001'
    }
  },
  {
    email: 'customer.retail2@mediq.com',
    mobile: '9000003002',
    name: 'Retail Customer Two',
    customer: {
      fullName: 'Retail Customer Two',
      buyerType: 'RETAIL',
      businessName: null,
      gstin: null,
      country: 'India',
      city: 'Bengaluru',
      deliveryAddress: 'Koramangala, Bengaluru',
      contactNumber: '9000003002'
    }
  },
  {
    email: 'customer.wholesale@mediq.com',
    mobile: '9000003003',
    name: 'Wholesale Buyer',
    customer: {
      fullName: 'Wholesale Buyer',
      buyerType: 'WHOLESALE',
      businessName: 'CityCare Wholesale LLP',
      gstin: '27PQRST3456U4Z8',
      country: 'India',
      city: 'Pune',
      deliveryAddress: 'Baner, Pune',
      contactNumber: '9000003003'
    }
  }
];

async function resetUsers() {
  const passwordHash = await bcrypt.hash(PASSWORD_PLAIN, 10);

  await prisma.$transaction(async (tx) => {
    const users = await tx.user.findMany({ select: { id: true } });
    const userIds = users.map((u) => u.id);

    if (userIds.length > 0) {
      const vendors = await tx.vendor.findMany({
        where: { userId: { in: userIds } },
        select: { id: true }
      });
      const vendorIds = vendors.map((v) => v.id);

      const orders = await tx.order.findMany({
        where: { userId: { in: userIds } },
        select: { id: true }
      });
      const orderIds = orders.map((o) => o.id);

      if (orderIds.length > 0) {
        await tx.payment.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.invoice.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }

      if (vendorIds.length > 0) {
        if (tx.payout && typeof tx.payout.deleteMany === 'function') {
          await tx.payout.deleteMany({ where: { vendorId: { in: vendorIds } } });
        }
        await tx.inventory.deleteMany({ where: { vendorId: { in: vendorIds } } });
      }

      await tx.customer.deleteMany({ where: { userId: { in: userIds } } });
      await tx.vendor.deleteMany({ where: { userId: { in: userIds } } });
      await tx.user.deleteMany({ where: { id: { in: userIds } } });
    }

    for (const admin of adminUsers) {
      await tx.user.create({
        data: {
          email: admin.email,
          mobile: admin.mobile,
          passwordHash,
          name: admin.name,
          role: 'ADMIN',
          isProfileComplete: true
        }
      });
    }

    for (const vendorUser of vendorUsers) {
      await tx.user.create({
        data: {
          email: vendorUser.email,
          mobile: vendorUser.mobile,
          passwordHash,
          name: vendorUser.name,
          role: 'VENDOR',
          isProfileComplete: true,
          vendor: {
            create: vendorUser.vendor
          }
        }
      });
    }

    for (const customerUser of customerUsers) {
      await tx.user.create({
        data: {
          email: customerUser.email,
          mobile: customerUser.mobile,
          passwordHash,
          name: customerUser.name,
          role: 'CUSTOMER',
          isProfileComplete: true,
          customer: {
            create: customerUser.customer
          }
        }
      });
    }
  }, {
    maxWait: 20000,
    timeout: 120000
  });

  const [users, admins, vendors, customers, retailCustomers, wholesaleCustomers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { role: 'VENDOR' } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.customer.count({ where: { buyerType: 'RETAIL' } }),
    prisma.customer.count({ where: { buyerType: 'WHOLESALE' } })
  ]);

  const createdEmails = await prisma.user.findMany({
    select: { email: true, role: true },
    orderBy: [{ role: 'asc' }, { email: 'asc' }]
  });

  console.log('User reset complete');
  console.log(`Total users: ${users}`);
  console.log(`Admins: ${admins}, Vendors: ${vendors}, Customers: ${customers}`);
  console.log(`Retail customers: ${retailCustomers}, Wholesale customers: ${wholesaleCustomers}`);
  console.log('Created accounts:');
  createdEmails.forEach((entry) => {
    console.log(`- ${entry.role}: ${entry.email}`);
  });
  console.log(`Shared password for all created users: ${PASSWORD_PLAIN}`);
}

resetUsers()
  .catch((error) => {
    console.error('Failed to reset users:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
