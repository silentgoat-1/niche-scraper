const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

async function uploadToGitHub(filePath) {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO;
    const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

    const [owner, repo] = GITHUB_REPO.split('/');
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    const content = fs.readFileSync(filePath, 'base64');
    const fileName = path.basename(filePath);

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: `data/reports/${fileName}`,
      message: `Add ${fileName}`,
      content,
      branch: GITHUB_BRANCH,
    });

    console.log(`✅ Report uploaded successfully: ${fileName}`);
  } catch (error) {
    console.error('❌ GitHub upload failed:', error.message);
  }
}

module.exports = { uploadToGitHub };
