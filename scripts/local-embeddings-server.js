#!/usr/bin/env node

/**
 * Local OpenAI-compatible embeddings server using Ollama
 * Maps OpenAI embedding API calls to local Ollama models
 */

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = 11435; // Different from Ollama's 11434

// Ollama endpoint
const OLLAMA_BASE = 'http://127.0.0.1:11434';

// Model that produces 1536 dimensions (compatible with text-embedding-3-small)
// We'll use a simple approach: duplicate 768-dim vectors to reach ~1536
const EMBEDDING_MODEL = 'nomic-embed-text';
const TARGET_DIMENSIONS = 1536;

/**
 * Get embeddings from Ollama
 */
async function getEmbedding(text) {
  try {
    const response = await axios.post(`${OLLAMA_BASE}/api/embeddings`, {
      model: EMBEDDING_MODEL,
      prompt: text
    });
    
    if (response.data && response.data.embedding) {
      return response.data.embedding;
    }
    throw new Error('Invalid response from Ollama');
  } catch (error) {
    console.error('Error getting embedding:', error.message);
    throw error;
  }
}

/**
 * Expand 768-dim vectors to 1536-dim by duplication
 * Simple hack to make it compatible with text-embedding-3-small
 */
function expandDimensions(vector, targetDim) {
  const currentDim = vector.length;
  const repeat = Math.floor(targetDim / currentDim);
  const result = [];
  
  for (let i = 0; i < repeat; i++) {
    result.push(...vector);
  }
  
  // Trim or pad to exact target
  while (result.length < targetDim) {
    result.push(0);
  }
  
  return result.slice(0, targetDim);
}

/**
 * OpenAI-compatible embeddings endpoint
 */
app.post('/v1/embeddings', async (req, res) => {
  try {
    const { input, model } = req.body;
    
    if (!input) {
      return res.status(400).json({ error: 'input is required' });
    }
    
    // Handle single string or array
    const inputs = Array.isArray(input) ? input : [input];
    const embeddings = [];
    
    for (const text of inputs) {
      const vector = await getEmbedding(text);
      const expanded = expandDimensions(vector, TARGET_DIMENSIONS);
      embeddings.push({
        object: 'list',
        index: embeddings.length,
        embedding: expanded
      });
    }
    
    res.json({
      object: 'list',
      data: embeddings,
      model: model || 'text-embedding-3-small',
      usage: {
        prompt_tokens: inputs.join(' ').length,
        total_tokens: inputs.join(' ').length
      }
    });
    
  } catch (error) {
    console.error('Embedding error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', model: EMBEDDING_MODEL, dimensions: TARGET_DIMENSIONS });
});

app.listen(PORT, () => {
  console.log(`Local OpenAI embeddings server running on port ${PORT}`);
  console.log(`Using Ollama model: ${EMBEDDING_MODEL}`);
  console.log(`Output dimensions: ${TARGET_DIMENSIONS} (expanded from 768)`);
  console.log(`Health check: http://127.0.0.1:${PORT}/health`);
});
