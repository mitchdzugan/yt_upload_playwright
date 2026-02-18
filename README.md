### steps to use
- `git clone https://github.com/mitchdzugan/yt-upload-playwright`
- `cd yt-upload-playwright`
- `npm i`
- `npx yt-upload-playwright --login` 
  Login to google in the opened browser, wait for it to navigate to the youtube studio page (select which account to use if multiple youtube accounts are tied to the same email) and finally close itself. The session will not be saved for use in the upload command if the window does not close itself
- `npx yt-upload-playwright (OPTS*) VIDEO_FILE`  
use `npx yt-upload-playwright --help` to see all `OPTS`


you can remove the login session saved to your computer via `npx yt-upload-playwright --rm-login` (you will need to use the login command again before subsequent uploads ofc)


