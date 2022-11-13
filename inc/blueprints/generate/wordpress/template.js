import fs        from 'fs-extra';
import path      from 'path';
import chalk     from 'chalk';
import titleCase from '../../../../utils/title-case.js';

export default (genNameDirty) => {

  const genName = genNameDirty.toLowerCase();
  const properTitle = titleCase(genName).replace('-', ' ');

  const pagePath = path.resolve(process.cwd() + '/src/pages/' + genName + '.twig');
  const templatePath = path.resolve(process.cwd() + '/template-' + genName + '.php');

  const pageContent = `{% extends "base.twig" %}

{% block content %}
  <h1>{{ post.title }}</h1>
{% endblock %}
`;

  const templateContent = `<?php
/**
 * Template Name: ${properTitle}
 */

$context = Timber::context();
$post = new TimberPost();
$context['post'] = $post;

Timber::render( 'src/pages/${genName}.twig', $context );
`;

  // Make sure page doesn't already exist
  if (fs.existsSync(templatePath) || fs.existsSync(pagePath)) {
    console.error('\n  \uD83D\uDEAB  ' + chalk.bold.red('Error: ') + chalk.bold.cyan(genName) + ' template already exists!\n');
    process.exit(1);
  }

  console.log('\nGenerating template...\n');

  // Create template file
  fs.writeFileSync(templatePath, templateContent);
  console.log('  \uD83D\uDC4D  ' + chalk.bold.green('Success! ') + chalk.cyan('template-' + genName + '.php') + ' successfully created');

  // Create twig file
  fs.writeFileSync(pagePath, pageContent);
  console.log('  \uD83D\uDC4D  ' + chalk.bold.green('Success! ') + chalk.cyan(genName + '.twig') + ' successfully created\n');
};
