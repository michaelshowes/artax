import fs        from 'fs-extra';
import path      from 'path';
import chalk     from 'chalk';
import titleCase from '../../../../utils/title-case.js';

export default (genNameDirty) => {

  const genName = genNameDirty.toLowerCase();
  const properTitle = titleCase(genName).replace('-', ' ');

  const genPath = path.resolve(process.cwd() + '/src/pages/' + genName + '.twig');

  const pageContent = `{% extends "layout.twig" %}

{% set page_title = "${properTitle}" %}

{% block body %}
  <!-- ${genName}.twig -->
  <h1>${properTitle}</h1>
{% endblock %}
`;

  // Make sure page doesn't already exist
  if (fs.existsSync(genPath)) {
    console.error('\n  \uD83D\uDEAB  ' + chalk.bold.red('Error: ') + chalk.bold.cyan(genName + '.twig') + ' already exists!\n');
    process.exit(1);
  }

  console.log('\nGenerating page...\n');

  // Create twig file
  fs.writeFileSync(genPath, pageContent);
  console.log('  \uD83D\uDC4D  ' + chalk.bold.green('Success! ') + chalk.cyan(genName + '.twig') + ' successfully created\n');
};
