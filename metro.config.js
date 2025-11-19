const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);

// Ignore the Next.js server folder
config.resolver.blacklistRE = [
  /server\/node_modules\/.*/,
  /server\/.*/,
];

module.exports = config;
