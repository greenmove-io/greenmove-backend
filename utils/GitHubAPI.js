import GitHub from 'github-api';

const {
  GITHUB_API_KEY,
  GITHUB_BRANCH
} = require('../config');

const gh = new GitHub({
  token: GITHUB_API_KEY
});

const repository = gh.getRepo('greenmove-io', 'greenmove-backend');

const updateHead = async (ref, commitSHA, force) => new Promise(async (res, rej) => await repository.updateHead(ref, commitSHA, force).then(result => res(result.data)).catch(err => rej(err.data)));

const addCommit = async (parent, tree, message) => new Promise(async (res, rej) => await repository.commit(parent, tree, message).then(result => res(result.data)).catch(err => rej(err.data)));

const getBranch = async (branch) => new Promise(async (res, rej) => await repository.getRef(branch).then(result => res(result.data)).catch(err => rej(err.data)));

const createTree = async (tree) => new Promise(async (res, rej) => await repository.createTree(tree).then(result => res(result.data)).catch(err => rej(err.data)));

const createBlob = async (data) => new Promise(async (res, rej) => await repository.createBlob(JSON.stringify(data)).then(result => res(result.data)).catch(err => rej(err.data)));

const getContents = async (ref, path, raw) => new Promise(async (res, rej) => await repository.getContents(ref, path, raw).then(result => res(result.data)).catch(err => rej(err)));

const PushBoundary = async (treeData) => {
  return new Promise(async (res, rej) => {
    let tree = await createTree(treeData).catch(err => rej(err));
    let branch = await getBranch(GITHUB_BRANCH).catch(err => rej(err));
    let commit = await addCommit(branch.object.sha, tree.sha, "Adding boundary data").catch(err => rej(err));
    let update = await updateHead(GITHUB_BRANCH, commit.sha, false).catch(err => rej(err));

    res(update);
  });
}

const GetBoundary = async (path, raw) => {
  return new Promise(async (res, rej) => {
    let boundary = await getContents(GITHUB_BRANCH, path, raw).catch(err => rej(err));

    res(boundary);
  });
}

const ResetBranch = async (sha) => {
  return new Promise(async (res, rej) => {
    let branch = await updateHead(GITHUB_BRANCH, sha, false).catch(err => rej(err));

    res(branch);
  });
}

export default { PushBoundary, GetBoundary, ResetBranch, createBlob };
