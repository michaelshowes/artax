#!/usr/bin/env node
process.env.AWS_PROFILE = 'IS';
process.env.AWS_SDK_LOAD_CONFIG = 1;

import { program }                                  from 'commander';
import fs                                           from 'fs-extra';
import path                                         from 'path';
import chalk                                        from 'chalk';
import { CloudFormationClient, CreateStackCommand } from '@aws-sdk/client-cloudformation';

program.parse(process.argv);

// .artaxrc file
const rcFile = path.join('', '.artaxrc');

// Make sure we're in the root of an artax project
if (!fs.existsSync(rcFile)) {
  console.error('\n  \uD83D\uDEAB  ' + chalk.bold.red('Error: ') + 'You must execute this command from the root of an artax project!\n');
  process.exit(1);
}

const projectName = fs.readJsonSync(rcFile).projectName;

const CloudFormation = new CloudFormationClient({
  region: 'us-east-1'
});

const command = new CreateStackCommand({
  StackName: projectName,
  Parameters: [
    {
      ParameterKey: 'ClientId',
      ParameterValue: projectName,
    }, {
      ParameterKey: 'DevENV',
      ParameterValue: 'html',
    }
  ],
  TemplateURL: 'https://s3.amazonaws.com/a.html.cloudforamtion.templates/static/html.s3.template'
});

try {
  const data = await CloudFormation.send(command);
  console.log('  \uD83D\uDC4D  ' + chalk.bold.green('Success! ') + ' s3 bucket successfully created at https://' + projectName + '.html.interactive-strategies.com/');
} catch (error) {
  console.error('\n  \uD83D\uDEAB  ' + chalk.bold.red('Error: ') + error.message + '\n');
}
