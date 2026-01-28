---
name: qmd-search
description: Quick Markdown Search - Local hybrid search for markdown notes, docs, and knowledge bases. Use when searching notes, finding related content, or retrieving documents from indexed collections.
---

# qmd - Quick Markdown Search

Local search engine for Markdown notes, docs, and knowledge bases. Index once, search fast.

## When to Use

Trigger phrases:
- "search my notes / docs / knowledge base"
- "find related notes"
- "retrieve a markdown document from my collection"
- "search local markdown files"

## Prerequisites

- Bun >= 1.0.0 (installed globally)
- Ensure PATH includes: `~/.bun/bin`

## Setup

### Initial Setup (one-time)

```bash
# Install via Bun (already done)
# bun install -g https://github.com/tobi/qmd

# Add a collection for your workspace
export PATH="$HOME/.bun/bin:$PATH"
qmd collection add /home/ubuntu/clawd --name clawd --mask "**/*.md"

# Optional: Add context description
qmd context add /home/ubuntu/clawd "Clyde's workspace - trading automation, GitHub repos, skills, documentation"

# Enable embeddings (one-time, can take time)
qmd embed
```

## Usage

### Basic Search (Fast - Keyword Match)

```bash
export PATH="$HOME/.bun/bin:$PATH"
qmd search "github credentials" -n 5
```

### Vector Search (Slower - Semantic Similarity)

```bash
export PATH="$HOME/.bun/bin:$PATH"
qmd vsearch "trading automation"
```

### Get Document by Path

```bash
export PATH="$HOME/.bun/bin:$PATH"
qmd get /home/ubuntu/clawd/AGENTS.md
```

### Multi-Get (Multiple Files)

```bash
export PATH="$HOME/.bun/bin:$PATH"
qmd multi-get "/home/ubuntu/clawd/skills/*/SKILL.md" --json
```

## Useful Options

- `-n <num>`: Number of results (default: 5, or 20 for --files)
- `-c, --collection <name>`: Restrict to a specific collection
- `--all --min-score <num>`: Return all matches above a threshold
- `--json` / `--files`: Agent-friendly output formats
- `--full`: Return full document content

## Collection Management

```bash
# List all collections
qmd collection list

# Add new collection
qmd collection add /path/to/notes --name notes --mask "**/*.md"

# Remove collection
qmd collection remove <name>

# Update index (when files change)
qmd update

# Refresh embeddings
qmd embed
```

## Performance Notes

- `qmd search` (BM25): Typically instant - use this for keyword searches
- `qmd vsearch` (vector): Can be ~1 minute on first run (local LLM loading)
- `qmd query` (hybrid): Includes LLM reranking - slower than vsearch
- For repeated semantic searches, the LLM stays in memory (faster)

## Maintenance

Keep index fresh so results stay current:

```bash
# For keyword search, just re-index:
qmd update

# Optional: Nightly embedding refresh (can be slow):
# Add to crontab if needed
```

## Integration with Clawdbot

### Memory System Integration

**Use qmd for:**
- Searching workspace documentation (`README.md`, `SKILL.md` files)
- Finding related skills or tools
- Retrieving configuration details
- Searching across all markdown files in workspace

**Use git-notes-memory for:**
- Storing decisions and preferences
- Structured, searchable by tags and entities
- Branch-aware memory across git branches

**Use LanceDB for:**
- Conversation context and automatic recall
- Storing facts and preferences from interactions

### Example Workflow

```
User: "How do I set up GitHub auth?"
Claude: [qmd search "GitHub credentials" -n 3]
        [Finds relevant documentation]
        [Provides accurate answer]

User: "I prefer FastAPI over Flask"
Claude: [git-notes: remember '{"preference": "FastAPI over Flask", "context": "user preference"}' -i h]
        [Silently stores to git notes]
```

## PATH Note

Always ensure PATH includes bun binary:
```bash
export PATH="$HOME/.bun/bin:$PATH"
```

Add to `~/.bashrc` or `~/.zshrc` for persistence.

## Troubleshooting

**qmd: command not found**
```bash
# Add to PATH for this session
export PATH="$HOME/.bun/bin:$PATH"

# Or add to shell config
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**No results found**
- Try broader search terms
- Use `qmd vsearch` for semantic similarity
- Check collection exists: `qmd collection list`

**Embeddings missing**
```bash
qmd embed
```

## Advanced Features

### MCP Server Mode (for Agent Integration)

```bash
# Start MCP server for AI agent integration
qmd mcp
```

This allows qmd to be used as an MCP tool by agents that support the Model Context Protocol.

### Batch Operations

```bash
# Get multiple files with specific formats
qmd multi-get "skills/*/SKILL.md,AGENTS.md" --md --json

# Get files with size limits
qmd multi-get "*.md" -l 100 --max-bytes 10000
```
