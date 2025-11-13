# Instructions to Create PR from `capolit` to `main`

## Current Status

The automated workflow designed to create the PR has been created and pushed, but requires manual approval to run. The workflow is located at `.github/workflows/create-capolit-pr.yml`.

## Option 1: Approve and Run the Workflow (Recommended)

1. Go to the GitHub Actions page: https://github.com/wwwrwww65-netizen/1111/actions/workflows/create-capolit-pr.yml
2. You should see pending workflow runs that require approval
3. Click on the workflow run and click "Approve and run"
4. The workflow will:
   - Check out the `capolit` branch
   - Add a `.github/.keep` file (since `capolit` and `main` are currently identical)
   - Push the change to `origin/capolit`
   - Create a PR with:
     - Title: "feature: create capolit from main"
     - Description: "نسخة فرع للاختبارات وتهيئة CI (GitHub Actions & build tests)"
     - Source: `capolit`
     - Base: `main`

## Option 2: Manual Steps Using GitHub Web Interface

If you prefer to do this manually or if the workflow doesn't work:

1. **Add a minimal change to the `capolit` branch:**
   ```bash
   # In your local repository
   git checkout capolit
   git pull origin capolit
   mkdir -p .github
   echo "# Placeholder file to trigger CI for capolit branch" > .github/.keep
   git add .github/.keep
   git commit -m "chore: trigger CI for capolit"
   git push origin capolit
   ```

2. **Create the PR using GitHub CLI or Web Interface:**
   
   Using GitHub CLI:
   ```bash
   gh pr create \
     --base main \
     --head capolit \
     --title "feature: create capolit from main" \
     --body "نسخة فرع للاختبارات وتهيئة CI (GitHub Actions & build tests)"
   ```
   
   Or via web interface:
   - Go to: https://github.com/wwwrwww65-netizen/1111/compare/main...capolit
   - Click "Create pull request"
   - Set title to: `feature: create capolit from main`
   - Set description to: `نسخة فرع للاختبارات وتهيئة CI (GitHub Actions & build tests)`
   - Click "Create pull request"

## Option 3: Manually Trigger the Workflow

The workflow also supports manual triggering via `workflow_dispatch`:

1. Go to: https://github.com/wwwrwww65-netizen/1111/actions/workflows/create-capolit-pr.yml
2. Click "Run workflow"
3. Select branch: `copilot/create-capolit-branch` (or `main`)
4. Click "Run workflow"

## Expected Result

After following any of the above options, you should have:
- A PR from `capolit` → `main`
- Title: "feature: create capolit from main"
- Description: "نسخة فرع للاختبارات وتهيئة CI (GitHub Actions & build tests)"
- The PR will be open for manual review (auto-merge is NOT enabled)

The PR URL will be in the format: `https://github.com/wwwrwww65-netizen/1111/pull/{number}`

## Notes

- The `capolit` branch currently exists and is at the same commit as `main`
- A minimal no-op change (`.github/.keep` file) will be added to allow the PR creation
- The workflow has been designed to be safe and non-destructive
