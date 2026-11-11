// Deixa o Metro enxergar a pasta ../shared (fora da raiz do app).
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const raizApp = __dirname;
const pastaShared = path.resolve(raizApp, '../shared');

const config = getDefaultConfig(raizApp);
config.watchFolders = [...(config.watchFolders ?? []), pastaShared];
// shared/ não tem dependências; qualquer import de pacote resolve no node_modules do app.
config.resolver.nodeModulesPaths = [path.resolve(raizApp, 'node_modules')];

module.exports = config;
