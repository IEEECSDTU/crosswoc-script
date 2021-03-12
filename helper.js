const { Octokit } = require('@octokit/core');
const CONSTANTS = require('./constants');
const octokit = new Octokit({
  auth: '177151cee7eacbae233e8a9d669e1d7afcd3d009',
  // auth: 'a2d642bcae8d47bd1cb23dc2cf954d7809c8da8f',
  // auth: 'b3b4ece495c418c21e18f3fbdf475be40be0e986',
});

exports.delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

exports.getScoreFromLabels = (labels) => {
  let score = 0;
  for (let i = 0; i < labels.length; i++) {
    const labelName = labels[i].name.toLowerCase();
    if (
      labelName.includes('50') ||
      labelName.includes('good first issue') ||
      labelName.includes('good') ||
      labelName.includes('good_first_issue') ||
      labelName.includes('good-first-issue')
    ) {
      score += 50;
      break;
    } else if (labelName.includes('easy') || labelName.includes('100')) {
      score += 100;
      break;
    } else if (labelName.includes('medium') || labelName.includes('200')) {
      score += 200;
      break;
    } else if (labelName.includes('hard') || labelName.includes('500')) {
      score += 500;
      break;
    } else {
      score += 0;
    }
  }

  return score;
};

exports.getAllPullRequestsOfRepository = async (repoOwner, repoName) => {
  let listOfAllPullRequests = [];
  let fetch = true;
  let i = 1;

  while (fetch) {
    let response;
    try {
      response = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
        owner: repoOwner,
        repo: repoName,
        state: 'closed',
        per_page: 50,
        page: i,
      });
    } catch (err) {
      console.log('Error in getAllPullRequestsOfRepository: \n', err);
      fetch = false;
    }

    // prevent unnecessary api call on error
    if (response && response.status !== 200) {
      fetch = false;
    }

    if (
      response &&
      response.status === 200 &&
      response.data &&
      response.data.length === 0
    ) {
      fetch = false;
    }

    if (response) {
      listOfAllPullRequests.push(...response.data);
    }

    i++;
  }

  return listOfAllPullRequests;
};

exports.getAllIssuesOfRepository = async (repoOwner, repoName) => {
  let listOfAllIssues = [];
  let fetch = true;
  let i = 1;

  while (fetch) {
    let response;
    try {
      response = await octokit.request('GET /repos/{owner}/{repo}/issues', {
        owner: repoOwner,
        repo: repoName,
        state: 'all',
        per_page: 50,
        page: i,
      });
    } catch (err) {
      console.log('Error in getAllIssuesOfRepository: \n', err);
      fetch = false;
    }

    // prevent unnecessary api call on error
    if (response && response.status !== 200) {
      fetch = false;
    }

    if (
      response &&
      response.status === 200 &&
      response.data &&
      response.data.length === 0
    ) {
      fetch = false;
    }

    if (response) {
      listOfAllIssues.push(...response.data);
    }

    i++;
  }

  return listOfAllIssues;
};

exports.getIssuesWithCrosswocLabel = (listOfAllIssues) => {
  const listOfCrosswocIssues = [];

  listOfAllIssues.forEach((issue) => {
    if (issue && issue.labels) {
      issue.labels.forEach((label) => {
        if (CONSTANTS.validCrossWocLabels.includes(label.name.toLowerCase())) {
          listOfCrosswocIssues.push(issue);
        }
      });
    }
  });

  return listOfCrosswocIssues;
};

exports.getFilteredPRData = (listOfAllPullRequests) =>
  listOfAllPullRequests.map((pr) => ({
    name: pr.title,
    status: pr.state,
    labels: pr.labels,
    htmlUrl: pr._links.html.href,
    userId: pr.user.login,
    isAdmin: pr.user.site_admin,
  }));

exports.addInMap = (map, id, score, prUrl) => {
  if (map[id]) {
    map[id].score += score;
    map[id].pullrequests.push(prUrl);
  } else {
    map[id] = {};
    map[id].score = score;
    map[id].pullrequests = [prUrl];
  }
};
