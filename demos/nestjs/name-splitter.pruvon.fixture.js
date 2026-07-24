require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { NameSplitterService } = require('./dist/name-splitter.service');

let appPromise;
function getApp() {
  if (!appPromise) {
    appPromise = NestFactory.createApplicationContext(AppModule, { logger: false });
  }
  return appPromise;
}

exports.firstName = async function (args) {
  const app = await getApp();
  return app.get(NameSplitterService).split(args[0]).firstName;
};

exports.lastName = async function (args) {
  const app = await getApp();
  return app.get(NameSplitterService).split(args[0]).lastName;
};
