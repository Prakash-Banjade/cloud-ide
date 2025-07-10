The problem you're encountering—where typing 'A' results in infinite 'A's appearing—is caused by a feedback loop:

1. **Local typing** triggers `onDidChangeModelContent`, which emits a `CODE_CHANGE`.
2. The **server rebroadcasts** and your client runs `executeEdits`, which again triggers `onDidChangeModelContent`.
3. This causes another emit and repeat—the infinite loop you see.

---

### 🚫 How to Fix It: Use a Guard Flag

You need to temporarily **suppress local emission** when applying remote changes:

```ts
const isUpdatingRemote = useRef(false);

useEffect(() => {
  if (!editorInstance || permission === EPermission.READ) return;

  const contentDisposable = editorInstance.onDidChangeModelContent(e => {
    if (isUpdatingRemote.current) return; // ❌ prevent echo
    socket.emit(SocketEvents.CODE_CHANGE, {
      path: selectedFile?.path,
      changes: e.changes,
      versionId: editorInstance.getModel()?.getVersionId()
    });
  });

  return () => contentDisposable.dispose();
}, [editorInstance, socket, selectedFile, permission]);
```

---

### ✅ When Applying Remote Changes

Wrap your `executeEdits` in this guard:

```ts
socket.on(SocketEvents.CODE_CHANGE, data => {
  if (selectedFile?.path !== data.path) return;

  const model = editorInstance.getModel();
  if (!model) return;

  isUpdatingRemote.current = true;

  editorInstance.executeEdits(
    "remote",
    data.changes.map(c => ({
      range: new monaco.Range(
        c.range.startLineNumber, c.range.startColumn,
        c.range.endLineNumber, c.range.endColumn
      ),
      text: c.text,
      forceMoveMarkers: true
    }))
  );

  isUpdatingRemote.current = false;
});
```

---

### 🧠 Why This Works

- The flag `isUpdatingRemote.current` prevents **your own `executeEdits`** from re-triggering `onDidChangeModelContent`.
- It **breaks the cycle**, ensuring local typing emits once and remote edits don't re-emit.
- This pattern is exactly what many New users in monaco collaborations do to avoid infinite loops [github.com+8github.com+8github.com+8](https://github.com/microsoft/monaco-editor/issues/2752?utm_source=chatgpt.com).