#!/usr/bin/env node
const path = require('path');
const register = require('tsconfig-paths').register;

// Register the path mappings
const cleanup = register({
  baseUrl: __dirname + '/dist',
  paths: {
    '@/*': ['./*'],
    '@/types/*': ['./types/*'],
    '@/controllers/*': ['./controllers/*'],
    '@/middleware/*': ['./middleware/*'],
    '@/entities/*': ['./entities/*'],
    '@/repositories/*': ['./repositories/*'],
    '@/services/*': ['./services/*'],
    '@/routes/*': ['./routes/*'],
    '@/config/*': ['./config/*'],
    '@/utils/*': ['./utils/*']
  }
});

require('./dist/server.js');
