# LPWAN Server Documentation Website

The core of the documentation are stored as markdown files in the `master` branch.
Those are copied into the `website` branch, and then the documentation website
is built and committed to the `gh-pages` branch.  Once the `gh-pages` branch
is pushed, Github will deploy the documentation website.

```
git fetch
git checkout website
# copy only the docs folder from master to website branch
git checkout master docs
cd website
npm install
npm run build
GIT_USER=github_username \
  CURRENT_BRANCH=website \
  USE_SSH=true \
  npm run publish-gh-pages
```
