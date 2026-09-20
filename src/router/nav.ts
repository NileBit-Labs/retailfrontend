export interface NavItem {
  label: string
  to: string
  icon: string
  owner: string
  ready?: boolean
  // Hidden from cashiers (the server refuses them regardless).
  managerOnly?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/', icon: 'dashboard', owner: 'Foundation' }],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Sell', to: '/pos', icon: 'sell', owner: 'Elioda — Sales/POS', ready: true },
      {
        label: 'Sales history',
        to: '/sales',
        icon: 'sales',
        owner: 'Elioda — Sales/POS',
        ready: true,
      },
      { label: 'Shifts', to: '/shifts', icon: 'shifts', owner: 'Elioda — Shifts', ready: true },
    ],
  },
  {
    label: 'Catalog',
    items: [
      {
        label: 'Products',
        to: '/products',
        icon: 'products',
        owner: 'Collins — Inventory',
        ready: true,
        managerOnly: true,
      },
      {
        label: 'Inventory',
        to: '/inventory',
        icon: 'inventory',
        owner: 'Collins — Inventory',
        ready: true,
        managerOnly: true,
      },
    ],
  },
  {
    label: 'Purchasing',
    items: [
      {
        label: 'Purchases',
        to: '/purchases',
        icon: 'purchases',
        owner: 'Collins — Purchases',
        ready: true,
        managerOnly: true,
      },
      {
        label: 'Suppliers',
        to: '/suppliers',
        icon: 'suppliers',
        owner: 'Collins — Purchases',
        ready: true,
        managerOnly: true,
      },
    ],
  },
  {
    label: 'Customers',
    items: [
      {
        label: 'Customers',
        to: '/customers',
        icon: 'customers',
        owner: 'Douglas — Customers',
        ready: true,
      },
      { label: 'Credit', to: '/credit', icon: 'credit', owner: 'Douglas — Customers', ready: true },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        label: 'Expenses',
        to: '/expenses',
        icon: 'expenses',
        owner: 'Elioda — Expenses',
        ready: true,
        managerOnly: true,
      },
      {
        label: 'Reports',
        to: '/reports',
        icon: 'reports',
        owner: 'Douglas — Reports',
        ready: true,
        managerOnly: true,
      },
    ],
  },
  {
    label: 'Intelligence',
    items: [{ label: 'Ask Your Shop', to: '/ask', icon: 'ask', owner: 'Backlog' }],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Users', to: '/users', icon: 'users', owner: 'Douglas — Users' },
      { label: 'Settings', to: '/settings', icon: 'settings', owner: 'Foundation' },
    ],
  },
]
