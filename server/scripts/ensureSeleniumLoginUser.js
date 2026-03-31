const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB, disconnectDB } = require('../config/database');
const User = require('../models/User');

async function main() {
  const [, , emailArg, passwordArg] = process.argv;
  const email = String(emailArg || '').trim().toLowerCase();
  const password = String(passwordArg || '');

  if (!email || !password) {
    throw new Error('Usage: node ensureSeleniumLoginUser.js <email> <password>');
  }

  await connectDB();

  try {
    let user = await User.findOne({ email });
    const existed = Boolean(user);

    if (!user) {
      user = new User({
        fullName: 'Selenium CI User',
        email,
        phoneNumber: `selenium-${Date.now()}`.slice(0, 15),
        passwordHash: password,
        dateOfBirth: new Date('1995-01-01'),
        gender: 'other',
        address: 'GitHub Actions CI',
        roleType: 'user',
        isVerified: true,
        isLocked: false,
      });
    } else {
      user.fullName = user.fullName || 'Selenium CI User';
      user.passwordHash = password;
      user.roleType = 'user';
      user.isVerified = true;
      user.isLocked = false;
      user.lockReason = undefined;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
    }

    await user.save();

    console.log(JSON.stringify({
      success: true,
      email,
      userId: String(user._id),
      created: !existed,
    }));
  } finally {
    await disconnectDB();
  }
}

main().catch(async (error) => {
  console.error(error.message);
  try {
    await disconnectDB();
  } catch (_) {
    // Ignore disconnect errors after a failure.
  }
  process.exit(1);
});
