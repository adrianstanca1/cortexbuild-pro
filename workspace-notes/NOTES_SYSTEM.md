# Notes System

## Quick Notes

Use these commands to manage notes:

### Create a note
```bash
# Create a new note
echo "# Note Title

Note content here..." > notes/YYYY-MM-DD-note-title.md
```

### List notes
```bash
ls -la notes/
```

### Search notes
```bash
grep -r "search term" notes/
```

### Read a note
```bash
cat notes/YYYY-MM-DD-note-title.md
```

## Note Format

All notes should follow this format:
```markdown
# Note Title

**Date:** YYYY-MM-DD
**Tags:** #tag1 #tag2

## Content

Your note content here...

## Action Items

- [ ] Task 1
- [ ] Task 2
```
