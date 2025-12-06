# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ToySPN Builder** is an educational web tool for learning SPN (Substitution-Permutation Network) block cipher fundamentals. It implements a minimal 16-bit block cipher with interactive visualization of encryption/decryption steps and avalanche analysis.

## Development Commands

This is a static HTML/CSS/JavaScript application with no build system.

**Local testing:**
```bash
# Open in browser (Windows)
start index.html

# Or use a simple HTTP server
python -m http.server 8000
# Then visit http://localhost:8000
```

**Deployment:**
The app is deployed via GitHub Pages. Simply push changes to the main branch - no build step required.

## Architecture

### Core Components

**Three-module architecture (IIFE pattern, no global pollution):**

1. **js/core.js** - Core cipher primitives → exports `window.ToySPN`
   - 16-bit block operations: S-box substitution (4-bit nibbles), bit permutation (P-layer), XOR key addition
   - Bijection validation for S-boxes and permutation layers
   - Key schedule: rotate + XOR with round constants
   - `encryptBlock()` / `decryptBlock()` - main cipher functions with optional step-by-step trace

2. **js/analysis.js** - Cryptanalysis tools → exports `window.ToySPNAnalysis`
   - Avalanche test implementation: measures output bit changes from 1-bit input differences
   - Histogram rendering for distribution visualization
   - Uses `crypto.getRandomValues()` for randomness (fallback to Math.random)

3. **js/ui.js** - DOM manipulation & event handling (no exports, self-contained IIFE)
   - Tab navigation between Designer/Crypto/Analysis/Learn panels
   - Grid editors for S-box (16 hex values) and P-layer (16 bit positions) with real-time bijection validation
   - Encrypt/Decrypt UI with step-by-step trace display
   - Avalanche test runner with canvas histogram

### Data Flow

**Encryption:** plaintext → SubNib (S-box on each 4-bit nibble) → PermuteBits (P-layer) → AddRoundKey (XOR) → repeat for R rounds → ciphertext

**Decryption:** ciphertext → XOR → InvP → InvS → repeat in reverse → plaintext

**Key schedule:** 16-bit master key → rotate by (round % 5 + 1) → XOR with round constant → produces round keys

### Bijection Requirements

Both S-box and P-layer MUST be bijective (invertible) for decryption to work. The UI validates this in real-time:
- S-box: all 16 values (0x0-0xF) must appear exactly once
- P-layer: all 16 bit positions (0-15) must appear exactly once

### UI State Management

Global state in ui.js:
- `S[]` - current S-box (16 elements)
- `P[]` - current P-layer (16 elements)
- Master key and rounds count read from inputs on-demand

Changes to S or P immediately update validation status. Encryption/decryption reads current state when triggered.

## Key Implementation Details

**16-bit constraints:**
- All operations use `& 0xFFFF` masking
- Hex inputs clamped to 4 characters
- Bit indices 0-15, nibble indices 0-3

**Permutation semantics:**
`P[i] = j` means bit i moves to position j (output[P[i]] = input[i])

**Default parameters:**
- S-box: `[C,5,6,B,9,0,A,D,3,E,F,8,4,7,1,2]` (hex)
- P-layer: `[0,4,8,12, 1,5,9,13, 2,6,10,14, 3,7,11,15]` (column-major like)
- Rounds: 8
- Master key example: `C0DE`

**Avalanche ideal:** ~8 bits flipped on average (50% of 16 bits) for good diffusion

## Security Implementation

This project emphasizes XSS prevention as an educational example:
- **No innerHTML** - all dynamic content uses `textContent` and `createElement`
- **CSP headers** - `script-src 'self'` blocks inline scripts
- **Input validation** - `clampHex16()` uses whitelist filtering (`/[^0-9a-fA-F]/g`)

## Educational Context

This is a teaching tool demonstrating how modern block ciphers combine:
1. Nonlinearity (S-box) to prevent linear attacks
2. Diffusion (P-layer) to spread bit changes
3. Key mixing (XOR) for security

The small block size (16-bit) and limited rounds (8) are intentionally weak for educational purposes - NOT for production use.
