#!/usr/bin/env node

import args from 'args';
import * as _ from '../lib.js';

args
  .command('upload', 'upload mp4 to youtube')
  .command('login', 'open a playwright session to login to your yt account');

async function main() {
  console.log(await Promise.resolve(1));
  const flags = args.parse(process.argv);
  console.log(flags);
}

_.processMain(main);
