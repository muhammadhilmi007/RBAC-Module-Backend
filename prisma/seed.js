// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Bersihkan database
  await prisma.aCL.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.permission.deleteMany();

  // Buat Permissions
  const permissions = await Promise.all([
    prisma.permission.create({ data: { name: 'View' } }),
    prisma.permission.create({ data: { name: 'Create' } }),
    prisma.permission.create({ data: { name: 'Edit' } }),
    prisma.permission.create({ data: { name: 'Delete' } })
  ]);

  console.log('Created permissions');

  // Buat Features
  const features = await Promise.all([
    prisma.feature.create({ 
      data: { 
        name: 'Dashboard', 
        route: '/dashboard',
        icon: 'dashboard'
      } 
    }),
    prisma.feature.create({ 
      data: { 
        name: 'Manajemen Pengguna', 
        route: '/users',
        icon: 'users'
      } 
    }),
    prisma.feature.create({ 
      data: { 
        name: 'Manajemen Cabang', 
        route: '/branches',
        icon: 'building'
      } 
    }),
    prisma.feature.create({ 
      data: { 
        name: 'Laporan Keuangan', 
        route: '/reports/finance',
        icon: 'chart-bar'
      } 
    }),
    prisma.feature.create({ 
      data: { 
        name: 'Pengaturan', 
        route: '/settings',
        icon: 'cog'
      } 
    })
  ]);

  console.log('Created features');

  // Buat Roles
  const superAdminRole = await prisma.role.create({
    data: { name: 'Super Admin' }
  });

  const kepalaCabangRole = await prisma.role.create({
    data: { name: 'Kepala Cabang' }
  });

  const adminRole = await prisma.role.create({
    data: { name: 'Admin' }
  });

  console.log('Created roles');

  // Buat akses Super Admin (akses penuh ke semua fitur)
  const superAdminACLs = [];
  for (const feature of features) {
    for (const permission of permissions) {
      superAdminACLs.push({
        roleId: superAdminRole.id,
        featureId: feature.id,
        permissionId: permission.id
      });
    }
  }

  await prisma.aCL.createMany({
    data: superAdminACLs
  });

  console.log('Created Super Admin ACLs');

  // Buat akses Kepala Cabang (hanya view dan edit untuk beberapa fitur)
  const kepalaCabangACLs = [
    // Dashboard (View only)
    {
      roleId: kepalaCabangRole.id,
      featureId: features[0].id, // Dashboard
      permissionId: permissions[0].id // View
    },
    // Manajemen Cabang (View and Edit)
    {
      roleId: kepalaCabangRole.id,
      featureId: features[2].id, // Manajemen Cabang
      permissionId: permissions[0].id // View
    },
    {
      roleId: kepalaCabangRole.id,
      featureId: features[2].id, // Manajemen Cabang
      permissionId: permissions[2].id // Edit
    },
    // Laporan Keuangan (View only)
    {
      roleId: kepalaCabangRole.id,
      featureId: features[3].id, // Laporan Keuangan
      permissionId: permissions[0].id // View
    }
  ];

  await prisma.aCL.createMany({
    data: kepalaCabangACLs
  });

  console.log('Created Kepala Cabang ACLs');

  // Buat akses Admin (hanya beberapa fitur dengan akses terbatas)
  const adminACLs = [
    // Dashboard (View only)
    {
      roleId: adminRole.id,
      featureId: features[0].id, // Dashboard
      permissionId: permissions[0].id // View
    },
    // Manajemen Pengguna (View, Create, Edit)
    {
      roleId: adminRole.id,
      featureId: features[1].id, // Manajemen Pengguna
      permissionId: permissions[0].id // View
    },
    {
      roleId: adminRole.id,
      featureId: features[1].id, // Manajemen Pengguna
      permissionId: permissions[1].id // Create
    },
    {
      roleId: adminRole.id,
      featureId: features[1].id, // Manajemen Pengguna
      permissionId: permissions[2].id // Edit
    }
  ];

  await prisma.aCL.createMany({
    data: adminACLs
  });

  console.log('Created Admin ACLs');

  // Buat users
  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.user.create({
    data: {
      name: 'Direktur Utama',
      email: 'direktur@example.com',
      password: hashedPassword,
      roleId: superAdminRole.id
    }
  });

  await prisma.user.create({
    data: {
      name: 'Kepala Cabang Jakarta',
      email: 'cabang.jakarta@example.com',
      password: hashedPassword,
      roleId: kepalaCabangRole.id
    }
  });

  await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      roleId: adminRole.id
    }
  });

  console.log('Created users');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });