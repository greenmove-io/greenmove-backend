import GitHub from 'github-api';

const {
  GITHUB_API_KEY
} = require('../config');

const gh = new GitHub({
  token: GITHUB_API_KEY
});

const repository = gh.getRepo('greenmove-io', 'greenmove-backend');

export const addCommit = async (parent, tree, message) => {
  return new Promise(async (res, rej) => {
    await repository.commit(parent, tree, message).catch(result => res(result.data)).catch(err => rej(err.data));
  });
}

export const getBranch = async (branch) => {
  return new Promise(async (res, rej) => {
    await repository.getBranch(branch).then(result => res(result.data)).catch(err => rej(err.data));
  });
}

export const createTree = async (tree) => {
  return new Promise(async (res, rej) => {
    await repository.createTree(tree).then(result => res(result.data)).catch(err => rej(err.data));
  });
}

export const createBlob = async (data) => {
  return new Promise(async (res, rej) => {
    await repository.createBlob(JSON.stringify(data)).then(result => res(result.data)).catch(err => rej(err.data));
  });
}

export const pushFile = async (filepath, data, commit) => {
  return new Promise(async (res, rej) => {
    await repository.writeFile(
      'file-storage',
      `assets/${filepath}`,
      JSON.stringify(data),
      commit
    ).then(result => res(result.data)).catch(err => rej(err));
  });
}
