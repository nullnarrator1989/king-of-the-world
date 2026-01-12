# Deploying Your Kingdom 👑

Here is how to release "The King Has Spoken" to the world, free of charge.

## Option 1: Render.com (Recommended)
Calculated, minimalist, effective. Just how the King likes it.

1.  **Push to GitHub**:
    *   Initialize a git repo in your project folder (if you haven't).
    *   Push this code to a new public GitHub repository.
2.  **Sign up for [Render.com](https://render.com/)**.
3.  **New Web Service**:
    *   Click "New +" -> "Web Service".
    *   Connect your GitHub repository.
4.  **Settings**:
    *   **Runtime**: Node
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
5.  **Deploy**: Click "Create Web Service".
    *   Render will detect the port (3000) and launch your site.

## Option 2: Glitch.com (Instant)
For when you need opinions immediately.

1.  Go to [Glitch.com](https://glitch.com/).
2.  Click **New Project** -> **Import from GitHub**.
3.  Paste your repository URL.
4.  Glitch will auto-install dependencies and start the server.
5.  Your site is live at `https://[project-name].glitch.me`.

---
*Note: The visitor counter currently resets if the free server sleeps/restarts. For a permanent legacy, consider using a database (like MongoDB Atlas) in the future.*
