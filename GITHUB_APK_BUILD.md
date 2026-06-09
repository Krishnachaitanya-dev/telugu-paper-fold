# GitHub APK Build

This Expo app can build an Android APK through GitHub Actions using `.github/workflows/android-apk.yml`.

## Required GitHub Secrets

In the GitHub repo, add these under `Settings -> Secrets and variables -> Actions`:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Push This Project

From this folder:

```sh
git init
git branch -M main
git remote add origin https://github.com/Krishnachaitanya-dev/telugu-news-hub.git
git add .
git commit -m "Migrate Expo Telugu news app"
git push -u origin main
```

If the GitHub repo already has commits, clone it first and copy this app into that clone instead of force-pushing.

## Build APK

After pushing:

1. Open the repo on GitHub.
2. Go to `Actions`.
3. Select `Build Android APK`.
4. Click `Run workflow`.
5. Download the `telugu-news-release-apk` artifact after the job finishes.
