// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Bersihkan database - hapus dalam urutan yang benar untuk menghindari constraint violations
  await prisma.auditLog.deleteMany();
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

  // Buat Roles dengan hierarki
  // Level 1 - Root Roles
  const superAdminRole = await prisma.role.create({
    data: { 
      name: 'Super Admin',
      description: 'Role dengan akses penuh ke seluruh sistem'
    }
  });

  // Level 2 - Roles dengan parent Super Admin
  const kepalaCabangRole = await prisma.role.create({
    data: { 
      name: 'Kepala Cabang',
      description: 'Mengelola operasional cabang',
      parentRoleId: superAdminRole.id // Mewarisi dari Super Admin
    }
  });

  const managerKeuanganRole = await prisma.role.create({
    data: { 
      name: 'Manager Keuangan',
      description: 'Mengelola keuangan perusahaan',
      parentRoleId: superAdminRole.id // Mewarisi dari Super Admin
    }
  });

  // Level 3 - Roles dengan parent Kepala Cabang
  const adminRole = await prisma.role.create({
    data: { 
      name: 'Admin',
      description: 'Administrasi umum',
      parentRoleId: kepalaCabangRole.id // Mewarisi dari Kepala Cabang
    }
  });

  const supervisorRole = await prisma.role.create({
    data: { 
      name: 'Supervisor',
      description: 'Mengawasi operasional harian',
      parentRoleId: kepalaCabangRole.id // Mewarisi dari Kepala Cabang
    }
  });

  // Level 3 - Roles dengan parent Manager Keuangan
  const staffKeuanganRole = await prisma.role.create({
    data: { 
      name: 'Staff Keuangan',
      description: 'Mengelola transaksi keuangan harian',
      parentRoleId: managerKeuanganRole.id // Mewarisi dari Manager Keuangan
    }
  });

  // Level 4 - Roles dengan parent Admin
  const operatorRole = await prisma.role.create({
    data: { 
      name: 'Operator',
      description: 'Operasional dasar sistem',
      parentRoleId: adminRole.id // Mewarisi dari Admin
    }
  });

  // Level 4 - Roles dengan parent Supervisor
  const staffCabangRole = await prisma.role.create({
    data: { 
      name: 'Staff Cabang',
      description: 'Staff operasional cabang',
      parentRoleId: supervisorRole.id // Mewarisi dari Supervisor
    }
  });

  console.log('Created roles with hierarchy');

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
    },
    // Pengaturan (View only)
    {
      roleId: kepalaCabangRole.id,
      featureId: features[4].id, // Pengaturan
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
    },
    // Pengaturan (View only)
    {
      roleId: adminRole.id,
      featureId: features[4].id, // Pengaturan
      permissionId: permissions[0].id // View
    }
  ];

  await prisma.aCL.createMany({
    data: adminACLs
  });

  console.log('Created Admin ACLs');

  // Buat users untuk testing hierarki role
  const hashedPassword = await bcrypt.hash('password', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: hashedPassword,
        roleId: superAdminRole.id
      }
    }),
    prisma.user.create({
      data: {
        name: 'Kepala Cabang',
        email: 'kepalacabang@example.com',
        password: hashedPassword,
        roleId: kepalaCabangRole.id
      }
    }),
    prisma.user.create({
      data: {
        name: 'Manager Keuangan',
        email: 'keuangan@example.com',
        password: hashedPassword,
        roleId: managerKeuanganRole.id
      }
    }),
    prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        roleId: adminRole.id
      }
    }),
    prisma.user.create({
      data: {
        name: 'Supervisor',
        email: 'supervisor@example.com',
        password: hashedPassword,
        roleId: supervisorRole.id
      }
    }),
    prisma.user.create({
      data: {
        name: 'Staff Keuangan',
        email: 'staffkeuangan@example.com',
        password: hashedPassword,
        roleId: staffKeuanganRole.id
      }
    }),
    prisma.user.create({
      data: {
        name: 'Operator',
        email: 'operator@example.com',
        password: hashedPassword,
        roleId: operatorRole.id
      }
    }),
    prisma.user.create({
      data: {
        name: 'Staff Cabang',
        email: 'staffcabang@example.com',
        password: hashedPassword,
        roleId: staffCabangRole.id
      }
    })
  ]);

  console.log('Created users with hierarchical roles');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });