const { generateMotivation } = require('./.next/server/app/actions.js');
// The next.js build output uses commonjs for server actions
// Wait, we can't easily require next.js server files like this due to webpack/aliasing.
