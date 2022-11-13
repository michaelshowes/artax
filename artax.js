#!/usr/bin/env node
import { program }  from 'commander';
import { readFile } from 'fs/promises';

const pkg = JSON.parse(await readFile(new URL('./package.json', import.meta.url)));

program
  .version(pkg.version)
  .usage('[command] <options>')
  .command('new', 'Create a new project').alias('n')
  .command('generate [generator-name] <name>', 'Create a component or page called [name]').alias('g')
  .command('s3', 'Create an s3 bucket using CloudFormation')
  program.parse(process.argv);
;
