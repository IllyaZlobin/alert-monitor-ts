/* eslint-disable @typescript-eslint/no-floating-promises */
import { resolve } from 'path';

import shell from 'shelljs';
import yargs from 'yargs';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { hideBin } = require('yargs/helpers');

(async function () {
  let args = hideBin(process.argv);

  // Remove the leading '--' if present, as it interferes with yargs parsing
  if (args[0] === '--') {
    args = args.slice(1);
  }

  const argv = await yargs(args).argv;

  const env = (argv as any).env;

  if (!env) {
    console.error('ERROR: No environment specified. Please provide --env argument.');
    process.exit(1);
  }
  const configPath = './typeorm-cli/config.ts';
  const cliPath = resolve(__dirname, '..', './node_modules/typeorm/cli.js');

  shell.env['APP_ENV'] = env;
  delete (argv as any).env;
  if (argv._[0] !== 'migration:create') {
    (argv as any).d = configPath;
  }

  let command = `node --nolazy -r ts-node/register -r tsconfig-paths/register ${cliPath} ${(argv as any)._.join(' ')}`;
  Object.keys(argv).forEach((key) => {
    if (key == '_' || key == '$0') return;
    command += ` --${key}="${(argv as any)[key]}"`;
  });
  const result = shell.exec(command);
  process.exit(result.code);
})();
