db = db.getSiblingDB('project_sem3');

const collections = [
  'users',
  'profiles',
  'contacts',
  'friend_requests',
  'friendships',
  'messages',
  'pending_registrations',
  'services',
  'service_subscriptions',
  'payments',
];

for (const name of collections) {
  if (!db.getCollectionNames().includes(name)) {
    db.createCollection(name);
  }
}

db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ mobileNumber: 1 }, { unique: true });

db.profiles.createIndex({ userId: 1 }, { unique: true });
db.contacts.createIndex({ ownerUserId: 1, contactNumber: 1 }, { unique: true });
db.friend_requests.createIndex(
  { senderUserId: 1, receiverUserId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  },
);
db.friendships.createIndex({ userId: 1, friendUserId: 1 }, { unique: true });
db.messages.createIndex({ senderUserId: 1, recipientPhoneNumber: 1, createdAt: -1 });
db.pending_registrations.createIndex({ username: 1 }, { unique: true });
db.pending_registrations.createIndex({ email: 1 }, { unique: true });
db.pending_registrations.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
db.services.createIndex({ key: 1 }, { unique: true });
db.service_subscriptions.createIndex({ userId: 1, serviceType: 1 }, { unique: true });
db.payments.createIndex({ txnRef: 1 }, { unique: true });

db.services.updateOne(
  { key: 'joke' },
  {
    $set: {
      key: 'joke',
      name: 'Joke',
      description: 'Light and funny stories delivered to brighten your day.',
      imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
      monthlyPrice: 10000,
      isActive: true,
    },
  },
  { upsert: true },
);

db.services.updateOne(
  { key: 'current_affairs' },
  {
    $set: {
      key: 'current_affairs',
      name: 'Current Affairs',
      description: 'Stay updated with short summaries of major events and public issues.',
      imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=900&q=80',
      monthlyPrice: 15000,
      isActive: true,
    },
  },
  { upsert: true },
);

db.services.updateOne(
  { key: 'sports' },
  {
    $set: {
      key: 'sports',
      name: 'Sports',
      description: 'Get match highlights, quick scores, and sports updates in one place.',
      imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80',
      monthlyPrice: 15000,
      isActive: true,
    },
  },
  { upsert: true },
);

db.services.updateOne(
  { key: 'news' },
  {
    $set: {
      key: 'news',
      name: 'News',
      description: 'Catch the latest headlines with short, easy-to-read news digests.',
      imageUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=900&q=80',
      monthlyPrice: 15000,
      isActive: true,
    },
  },
  { upsert: true },
);

const adminUser = db.users.findOne({ email: 'admin@gmail.com' });

if (adminUser) {
  const sampleFriends = [
    {
      username: 'anna_friend',
      email: 'anna.friend@example.com',
      mobileNumber: '0911111111',
      displayName: 'Anna Carter',
      imageUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80',
    },
    {
      username: 'mike_friend',
      email: 'mike.friend@example.com',
      mobileNumber: '0922222222',
      displayName: 'Mike Johnson',
      imageUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
    },
  ];

  sampleFriends.forEach((friend) => {
    db.users.updateOne(
      { email: friend.email },
      {
        $set: {
          username: friend.username,
          email: friend.email,
          mobileNumber: friend.mobileNumber,
          mobileVerified: true,
          emailVerified: true,
          isActive: true,
          role: 'user',
        },
        $setOnInsert: {
          passwordHash: 'seeded-friend-account',
        },
      },
      { upsert: true },
    );

    const friendUser = db.users.findOne({ email: friend.email });

    db.profiles.updateOne(
      { userId: friendUser._id },
      {
        $set: {
          userId: friendUser._id,
          name: friend.displayName,
          gender: 'other',
          dob: new Date('2000-01-01'),
          address: 'Ho Chi Minh City',
          maritalStatus: 'single',
          emailAddress: friend.email,
          hobbies: ['chatting'],
          likes: ['friends'],
          dislikes: [],
          cuisines: [],
          sports: [],
          imageUrl: friend.imageUrl,
          workStatus: 'student',
        },
      },
      { upsert: true },
    );

    db.friendships.updateOne(
      { userId: adminUser._id, friendUserId: friendUser._id },
      {
        $set: {
          userId: adminUser._id,
          friendUserId: friendUser._id,
          becameFriendsAt: new Date(),
        },
      },
      { upsert: true },
    );

    db.friendships.updateOne(
      { userId: friendUser._id, friendUserId: adminUser._id },
      {
        $set: {
          userId: friendUser._id,
          friendUserId: adminUser._id,
          becameFriendsAt: new Date(),
        },
      },
      { upsert: true },
    );
  });
}
