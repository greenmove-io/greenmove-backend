import GitHub from 'github-api';

const {
  GITHUB_API_KEY
} = require('../config');

const gh = new GitHub({
  token: GITHUB_API_KEY
});

export const pushFile = async (filename, data, commit) => {
  const repository = gh.getRepo('greenmove-io', 'greenmove-backend');

  repository.write(
    'file',
    `assets/boundaries/places/${filename}`,
    data,
    commit
  )
}
