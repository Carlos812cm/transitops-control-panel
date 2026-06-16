import 'dotenv/config';

import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL'],
});

const prisma = new PrismaClient({
  adapter,
});

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const operatorPasswordHash = await bcrypt.hash('operator123', 10);
  const supervisorPasswordHash = await bcrypt.hash('supervisor123', 10);
  const viewerPasswordHash = await bcrypt.hash('viewer123', 10);

  await prisma.trip.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.transitRoute.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: 'Admin Demo',
      email: 'admin@transitops.com',
      phone: '+525500000001',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const operator = await prisma.user.create({
    data: {
      name: 'Operator Demo',
      email: 'operator@transitops.com',
      phone: '+525500000002',
      passwordHash: operatorPasswordHash,
      role: 'OPERATOR',
      status: 'ACTIVE',
    },
  });

  const supervisor = await prisma.user.create({
    data: {
      name: 'Supervisor Demo',
      email: 'supervisor@transitops.com',
      phone: '+525500000003',
      passwordHash: supervisorPasswordHash,
      role: 'SUPERVISOR',
      status: 'ACTIVE',
    },
  });

  const viewer = await prisma.user.create({
    data: {
      name: 'Viewer Demo',
      email: 'viewer@transitops.com',
      phone: '+525500000004',
      passwordHash: viewerPasswordHash,
      role: 'VIEWER',
      status: 'ACTIVE',
    },
  });

  const sprinter = await prisma.vehicle.create({
    data: {
      unitNumber: 'ABC-123',
      brand: 'Mercedes-Benz',
      model: 'Sprinter',
      year: 2022,
      capacity: 18,
      status: 'AVAILABLE',
      lastMaintenanceDate: new Date('2026-05-20T10:00:00.000Z'),
    },
  });

  await prisma.vehicle.createMany({
    data: [
      {
        unitNumber: 'XYZ-987',
        brand: 'Volvo',
        model: '7900',
        year: 2021,
        capacity: 45,
        status: 'MAINTENANCE',
        lastMaintenanceDate: new Date('2026-06-01T12:00:00.000Z'),
      },
      {
        unitNumber: 'BUS-204',
        brand: 'Mercedes-Benz',
        model: 'Torino',
        year: 2020,
        capacity: 38,
        status: 'INACTIVE',
        lastMaintenanceDate: new Date('2026-04-15T09:00:00.000Z'),
      },
    ],
  });

  const activeDriver = await prisma.driver.create({
  data: {
    firstName: 'Luc\u00eda',
    lastName: 'Rojas',
    licenseNumber: 'LIC-TR-001',
    phone: '+525511110001',
    email: 'lucia.rojas@transitops.com',
    status: 'ACTIVE',
    },
  });

  await prisma.driver.createMany({
    data: [
      {
        firstName: 'Mart\u00edn',
        lastName: 'L\u00f3pez',
        licenseNumber: 'LIC-TR-002',
        phone: '+525511110002',
        email: 'martin.lopez@transitops.com',
        status: 'SUSPENDED',
      },
      {
        firstName: 'Sof\u00eda',
        lastName: 'Herrera',
        licenseNumber: 'LIC-TR-003',
        phone: '+525511110003',
        email: 'sofia.herrera@transitops.com',
        status: 'INACTIVE',
      },
    ],
  });

  const airportRoute = await prisma.transitRoute.create({
    data: {
      name: 'Centro - Aeropuerto',
      origin: 'Centro Hist\u00f3rico',
      destination: 'Aeropuerto Internacional',
      distanceKm: 12.5,
      estimatedDurationMinutes: 35,
      status: 'ACTIVE',
    },
  });

  await prisma.transitRoute.create({
    data: {
      name: 'Norte - Sur',
      origin: 'Terminal Norte',
      destination: 'Terminal Sur',
      distanceKm: 24.8,
      estimatedDurationMinutes: 65,
      status: 'INACTIVE',
    },
  });

  await prisma.trip.createMany({
    data: [
      {
        vehicleId: sprinter.id,
        driverId: activeDriver.id,
        routeId: airportRoute.id,
        scheduledDeparture: new Date('2026-06-12T14:00:00.000Z'),
        status: 'SCHEDULED',
        notes: 'Initial scheduled demo trip.',
      },
      {
        vehicleId: sprinter.id,
        driverId: activeDriver.id,
        routeId: airportRoute.id,
        scheduledDeparture: new Date('2026-06-10T16:00:00.000Z'),
        status: 'COMPLETED',
        notes: 'Completed demo trip.',
      },
    ],
  });

  console.log('Seed completed successfully.');
  console.log('');
  console.log('Demo users:');
  console.log(`- ${admin.email} / admin123`);
  console.log(`- ${operator.email} / operator123`);
  console.log(`- ${supervisor.email} / supervisor123`);
  console.log(`- ${viewer.email} / viewer123`);
}

main()
  .catch((error) => {
    console.error('Seed failed.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
