import { Octokit } from '@octokit/rest';

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const baseBranch = process.env.GIT_DEFAULT_BRANCH ?? 'main';
const token = process.env.GITHUB_TOKEN;

if (!owner || !repo) {
  throw new Error('GITHUB_OWNER and GITHUB_REPO must be configured');
}
if (!token) {
  throw new Error('GITHUB_TOKEN must be configured');
}

const octokit = new Octokit({ auth: token });

export async function openPullRequest({
  branch,
  title,
  body,
  files,
}: {
  branch: string;
  title: string;
  body?: string;
  files: Record<string, string>;
}) {
  if (!Object.keys(files).length) {
    throw new Error('No files to include in the pull request');
  }

  const { data: baseRef } = await octokit.git.getRef({ owner, repo, ref: `heads/${baseBranch}` });
  const baseCommitSha = baseRef.object.sha;
  const { data: baseCommit } = await octokit.git.getCommit({ owner, repo, commit_sha: baseCommitSha });
  const baseTreeSha = baseCommit.tree.sha;

  const tree = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: await Promise.all(
      Object.entries(files).map(async ([path, content]) => {
        const { data } = await octokit.git.createBlob({ owner, repo, content, encoding: 'utf-8' });
        return {
          path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: data.sha,
        };
      }),
    ),
  });

  const commit = await octokit.git.createCommit({
    owner,
    repo,
    message: title,
    tree: tree.data.sha,
    parents: [baseCommitSha],
  });

  try {
    await octokit.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: commit.data.sha });
  } catch (error) {
    if ((error as any)?.status !== 422) {
      throw error;
    }
    await octokit.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: commit.data.sha, force: true });
  }

  const pr = await octokit.pulls.create({
    owner,
    repo,
    title,
    head: branch,
    base: baseBranch,
    body,
  });

  return pr.data;
}
