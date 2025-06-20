# This is the Nest Application used to provide pseudo terminal.

## Why this needed separately?

Providing pty directly from the main runner leads to expose environment variables and other sensitive information to the user. Hence, it is better to provide pty as a separate service and rest the code and secrets resides in the main runner.  

Even thought there are two separate containers Kubernetes gives you a shared filesystem via your `emptyDir` (or any other shared volume). As long as both containers mount the same volume at the same path, anything you do in one shows up in the other.

## How it actually works

`emptyDir` volume is created per‑Pod.  

Both your pty and runner containers mount that same volume at, say, /workspace.  

In your pty container you must WORKDIR /workspace (or cd /workspace) before spawning the shell.  

When you `touch index.js` (or edit, delete, etc.), you are writing into `/workspace/index.js` — which lives on the shared volume.  

The runner container also sees `/workspace/index.js` because it, too, has that volume mounted at `/workspace`.  