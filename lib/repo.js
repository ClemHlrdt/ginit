const CLI = require('clui');
const fs = require('fs');
const simpleGit = require('simple-git');
const touch = require("touch");
const _ = require('lodash');

const inquirer = require('./inquirer');
const gh = require('./github');


const git = simpleGit();
const Spinner = CLI.Spinner;

module.exports = {
  createRemoteRepo: async () => {
    const github = gh.getInstance();
    const answers = await inquirer.askRepoDetails();

    const data = {
      name: answers.name,
      description: answers.description,
      private: (answers.visibility === 'private')
    };

    const status = new Spinner('Creating remote repository...');
    status.start();

    try {
      const response = await github.repos.createForAuthenticatedUser(data);
      return response.data.ssh_url;
    } finally {
      status.stop();
    }
  },

  askIgnoreFiles: (filelist) => {
  const questions = [
    {
      type: 'checkbox',
      name: 'ignore',
      message: 'Select the files and/or folders you wish to ignore:',
      choices: filelist,
      default: ['node_modules', 'bower_components']
    }
  ];
    return inquirer.prompt(questions);
  },
  
  setupRepo: async (url) => {
  const status = new Spinner('Initializing local repository and pushing to remote...');
  status.start();

    try {
      await git.init()
      await git.add('.gitignore')
      await git.add('./*')
      await git.commit('Initial commit')
      await git.addRemote('origin', url)
      await git.push('origin', 'master')
    } finally {
      status.stop();
    }
  },

  createGitignore: async () => {
  const filelist = _.without(fs.readdirSync('.'), '.git', '.gitignore');

  if (filelist.length) {
    const answers = await inquirer.askIgnoreFiles(filelist);

    if (answers.ignore.length) {
      fs.writeFileSync( '.gitignore', answers.ignore.join( '\n' ) );
    } else {
      touch( '.gitignore' );
    }
  } else {
    touch('.gitignore');
  }
},
};
