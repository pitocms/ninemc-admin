// Admin Routes
export const ADMIN_ROUTES = {
    LOGIN: '/login',
    HOME: '',
    USERS: '/users',
    MK_USERS: '/mk-users',
    UPLOADS: '/uploads',
    REWARDS: '/rewards',
    JK_REWARDS: '/jk-rewards',
    WITHDRAWALS: '/withdrawals',
    JK_WITHDRAWALS: '/jk-withdrawals',
    INQUIRIES: '/inquiries',
    ADMINISTRATORS: '/administrators',
    MEMBERSHIP: '/membership',
    SETTINGS: '/settings',
    JK_DATA_IMPORT: '/jk-data-import',
    JK_DATA_IMPORT_RECORDS: '/jk-data-import/records',
  };
  
  // Junket Data Import Status enum (matching Prisma schema)
  export const JUNKET_DATA_IMPORT_STATUS = {
    IMPORTED: 'imported',
    CONFIRMED: 'confirmed',
    CALCULATED: 'calculated',
    APPROVED: 'approved',
  };
  
  // MLM reward types (Junket rewards are in separate table)
  export const REWARD_TYPES = [
    'FIRST',
    'SECOND',
    'ADVISOR',
    'CLOSER',
    'SUBSCRIPTION',
    'UNILEVEL',
    'ADMIN',
    'TITLE'
  ];
  
  export const REWARD_STATUS = ['PENDING', 'APPROVED'];
  
  // Admin Withdrawal constants
  export const WITHDRAWAL_STATUS = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'];
  export const WITHDRAWAL_TYPES = ['normal', 'junket'];