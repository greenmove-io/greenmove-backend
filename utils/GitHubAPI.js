import GitHub from 'github-api';

const {
  GITHUB_API_KEY
} = require('../config');

const gh = new GitHub({
  token: GITHUB_API_KEY
});

export const pushFile = async (filepath, data, commit) => {
  const repository = gh.getRepo('greenmove-io', 'greenmove-backend');

  return new Promise((res, rej) => {
    repository.writeFile(
      'file-storage',
      `assets/${filepath}`,
      JSON.stringify(data),
      commit
    ).then(result => res(result.data)).catch(err => rej(err));
  });
}
