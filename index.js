const fs = require('fs');
const scrapeIt = require('scrape-it');
// const { githubToken } = require('./config');
const jsonexport = require('jsonexport');
const CONSTANTS = require('./constants');
const {
  delay,
  addInMap,
  getFilteredPRData,
  getScoreFromLabels,
  getAllIssuesOfRepository,
  getIssuesWithCrosswocLabel,
  getAllPullRequestsOfRepository,
} = require('./helper');

const allContributors = {};

const calcScoreOfParticipantsInRepo = async (repoOwner, repoName) => {
  console.log(repoOwner, repoName)
  const listOfAllIssues = await getAllIssuesOfRepository(repoOwner, repoName);
  const listOfAllPullRequests = await getAllPullRequestsOfRepository(
    repoOwner,
    repoName
  );

  const listOfCrosswocIssues = getIssuesWithCrosswocLabel(listOfAllIssues);
  const filteredPullRequestData = getFilteredPRData(listOfAllPullRequests);

  // console.log(
  //   listOfAllIssues.length,
  //   '\n \n \n \n',
  //   listOfCrosswocIssues.length,
  //   '\n \n \n \n',
  //   filteredPullRequestData.length
  // );

  filteredPullRequestData.forEach(async (pullRequest) => {
    try {
      const { data, response } = await scrapeIt(pullRequest.htmlUrl, {
        linkedIssueName: '.my-1',
      });

      // ASSUMPTION: all PRs are linked with an Issue
      if (response.statusCode === 200 && data.linkedIssueName) {
        // ASSUMPTION: all issue names are unique
        const matchingIssues = listOfCrosswocIssues.filter(
          (issue) => issue.title === data.linkedIssueName
        );
        const currentIssue = matchingIssues && matchingIssues[0];

        if (currentIssue && !pullRequest.isAdmin) {
          const score = getScoreFromLabels(currentIssue.labels);
          const userGitID = pullRequest.userId;
          addInMap(allContributors, userGitID, score, pullRequest.htmlUrl);
          // console.log(allContributors);
        }
      }
    } catch (err) {
      console.error(err);
    }
  });
};

const start = async () => {
  for (let item of CONSTANTS.listOfReposAndOwners) {
    await delay(3000);
    await calcScoreOfParticipantsInRepo(item.ownerName, item.repoName);
  }
};

start()
  .then(() => {
    console.log('DONE ALL');

    console.log(
      '\n\n\n\n\n\n\n\n\n allContributors: \n',
      allContributors,
      Object.keys(allContributors).length
    );

    jsonexport(allContributors, function (err, csv) {
      if (err) return console.error(err);
      console.log(csv);

      fs.writeFile('./contributors.csv', csv, (err) => console.error(err));
    });
  })
  .catch(console.error);
