db = db.getSiblingDB('project_sem3');

const usernames = [
  'admin',
  'canh',
  'anna_friend',
  'mike_friend',
  'request_demo',
  'superadmin',
];

const users = db.users
  .find({ username: { $in: usernames } }, { username: 1 })
  .toArray();

const userMap = new Map(users.map((user) => [user.username, user]));

function daysAgo(days, hour) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

const demoSubscriptions = [
  {
    username: 'admin',
    serviceType: 'current_affairs',
    status: 'active',
    priceAmount: 15000,
    autoRenew: true,
    activatedAt: daysAgo(14, 9),
    expiresAt: daysAgo(-16, 9),
  },
  {
    username: 'canh',
    serviceType: 'joke',
    status: 'active',
    priceAmount: 10000,
    autoRenew: true,
    activatedAt: daysAgo(10, 10),
    expiresAt: daysAgo(-20, 10),
  },
  {
    username: 'canh',
    serviceType: 'sports',
    status: 'pending',
    priceAmount: 15000,
    autoRenew: false,
  },
  {
    username: 'anna_friend',
    serviceType: 'news',
    status: 'active',
    priceAmount: 15000,
    autoRenew: true,
    activatedAt: daysAgo(8, 11),
    expiresAt: daysAgo(-22, 11),
  },
  {
    username: 'mike_friend',
    serviceType: 'current_affairs',
    status: 'expired',
    priceAmount: 15000,
    autoRenew: false,
    activatedAt: daysAgo(40, 8),
    expiresAt: daysAgo(10, 8),
  },
  {
    username: 'request_demo',
    serviceType: 'sports',
    status: 'active',
    priceAmount: 15000,
    autoRenew: false,
    activatedAt: daysAgo(5, 14),
    expiresAt: daysAgo(-25, 14),
  },
  {
    username: 'superadmin',
    serviceType: 'news',
    status: 'cancelled',
    priceAmount: 15000,
    autoRenew: false,
    activatedAt: daysAgo(12, 15),
    expiresAt: daysAgo(2, 15),
  },
];

let seededSubscriptions = 0;

for (const item of demoSubscriptions) {
  const user = userMap.get(item.username);
  if (!user) {
    continue;
  }

  db.service_subscriptions.updateOne(
    { userId: user._id, serviceType: item.serviceType },
    {
      $set: {
        userId: user._id,
        serviceType: item.serviceType,
        status: item.status,
        autoRenew: item.autoRenew,
        activatedAt: item.activatedAt,
        expiresAt: item.expiresAt,
        priceAmount: item.priceAmount,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  seededSubscriptions += 1;
}

const demoPayments = [
  {
    txnRef: 'DEMO-ORDER-20260403-01',
    username: 'admin',
    amount: 120000,
    status: 'success',
    orderStatus: 'completed',
    serviceTypes: ['current_affairs'],
    paidAt: daysAgo(6, 9),
  },
  {
    txnRef: 'DEMO-ORDER-20260404-01',
    username: 'canh',
    amount: 85000,
    status: 'success',
    orderStatus: 'completed',
    serviceTypes: ['joke', 'sports'],
    paidAt: daysAgo(5, 10),
  },
  {
    txnRef: 'DEMO-ORDER-20260405-01',
    username: 'anna_friend',
    amount: 145000,
    status: 'success',
    orderStatus: 'approved',
    serviceTypes: ['news'],
    paidAt: daysAgo(4, 11),
  },
  {
    txnRef: 'DEMO-ORDER-20260406-01',
    username: 'mike_friend',
    amount: 65000,
    status: 'success',
    orderStatus: 'completed',
    serviceTypes: ['current_affairs'],
    paidAt: daysAgo(3, 12),
  },
  {
    txnRef: 'DEMO-ORDER-20260407-01',
    username: 'request_demo',
    amount: 99000,
    status: 'success',
    orderStatus: 'approved',
    serviceTypes: ['sports'],
    paidAt: daysAgo(2, 13),
  },
  {
    txnRef: 'DEMO-ORDER-20260408-01',
    username: 'superadmin',
    amount: 180000,
    status: 'success',
    orderStatus: 'completed',
    serviceTypes: ['news', 'joke'],
    paidAt: daysAgo(1, 14),
  },
  {
    txnRef: 'DEMO-ORDER-20260409-01',
    username: 'canh',
    amount: 210000,
    status: 'success',
    orderStatus: 'approved',
    serviceTypes: ['joke', 'news'],
    paidAt: daysAgo(0, 15),
  },
  {
    txnRef: 'DEMO-ORDER-20260409-02',
    username: 'admin',
    amount: 175000,
    status: 'pending',
    orderStatus: 'pending',
    serviceTypes: ['sports', 'news'],
  },
  {
    txnRef: 'DEMO-ORDER-20260408-02',
    username: 'request_demo',
    amount: 95000,
    status: 'cancelled',
    orderStatus: 'cancelled',
    serviceTypes: ['sports'],
  },
  {
    txnRef: 'DEMO-ORDER-20260405-02',
    username: 'mike_friend',
    amount: 50000,
    status: 'failed',
    orderStatus: 'cancelled',
    serviceTypes: ['current_affairs'],
  },
];

let seededPayments = 0;

for (const item of demoPayments) {
  const user = userMap.get(item.username);
  if (!user) {
    continue;
  }

  db.payments.updateOne(
    { txnRef: item.txnRef },
    {
      $set: {
        userId: user._id,
        provider: 'vnpay',
        txnRef: item.txnRef,
        amount: item.amount,
        currency: 'VND',
        status: item.status,
        orderStatus: item.orderStatus,
        serviceTypes: item.serviceTypes,
        orderInfo: 'Dashboard demo order',
        responseCode: item.status === 'success' ? '00' : item.status === 'pending' ? '' : '99',
        paidAt: item.paidAt,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  seededPayments += 1;
}

printjson({
  message: 'Dashboard demo data seeded successfully.',
  subscriptionsSeeded: seededSubscriptions,
  paymentsSeeded: seededPayments,
  paymentsTotal: db.payments.countDocuments(),
  subscriptionsTotal: db.service_subscriptions.countDocuments(),
});
