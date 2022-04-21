import GitHub from 'github-api';

const {
  GITHUB_API_KEY,
  GITHUB_BRANCH
} = require('../config');

const gh = new GitHub({
  token: GITHUB_API_KEY
});

const repository = gh.getRepo('greenmove-io', 'greenmove-backend');

const updateHead = async (ref, commitSHA, force) => {
  return new Promise(async (res, rej) => {
    await repository.updateHead(ref, commitSHA, force).then(result => res(result.data)).catch(err => rej(err.data));
  });
}

const addCommit = async (parent, tree, message) => {
  return new Promise(async (res, rej) => {
    await repository.commit(parent, tree, message).then(result => res(result.data)).catch(err => rej(err.data));
  });
}

const getBranch = async (branch) => {
  return new Promise(async (res, rej) => {
    await repository.getRef(branch).then(result => res(result.data)).catch(err => rej(err.data));
  });
}

const createTree = async (tree) => {
  return new Promise(async (res, rej) => {
    await repository.createTree(tree).then(result => res(result.data)).catch(err => rej(err.data));
  });
}

export const createBlob = async (data) => {
  return new Promise(async (res, rej) => {
    await repository.createBlob(JSON.stringify(data)).then(result => res(result.data)).catch(err => rej(err.data));
  });
}

export const getContents = async (ref, path, raw) => {
  return new Promise(async (res, rej) => {
    await repository.getContents(ref, path, raw).then(result => res(result.data)).catch(err => rej(err));
  });
}

export const PushBoundary = async (treeData) => {
  return new Promise(async (res, rej) => {
    let tree = await createTree(treeData).catch(err => rej(err));
    let branch = await getBranch(GITHUB_BRANCH).catch(err => rej(err));
    let commit = await addCommit(branch.object.sha, tree.sha, "Adding boundary data").catch(err => rej(err));
    let update = await updateHead(GITHUB_BRANCH, commit.sha, false).catch(err => rej(err));

    res(update);
  });
}

export const GetBoundary = async (path, raw) => {
  return new Promise(async (res, rej) => {
    let boundary = await getContents(GITHUB_BRANCH, path, raw).catch(err => rej(err));

    res(boundary);
  });
}
