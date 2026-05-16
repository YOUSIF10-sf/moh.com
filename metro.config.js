// metro.config.js
// يضمن هذا الملف أن Metro Bundler يستخدم الامتدادات الصحيحة لكل منصة
// .web.ts → للمتصفح | .ts → للجهاز المحمول
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;
