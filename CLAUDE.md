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
The app is deployed via GitHub Pages. Use a work branch and a PR. Wait for both push and pull_request Test runs to succeed, then use an ordinary merge. Do not push directly to main. Verify main CI, Pages, public file hashes, and browser behavior before backed-up branch cleanup. No build step is required.

## Architecture

### Core Components

**Four-module architecture (IIFE with explicit public APIs):**

1. **js/core.js** - Core cipher primitives → exports `window.ToySPN`
   - 16-bit block operations: S-box substitution (4-bit nibbles), bit permutation (P-layer), XOR key addition
   - Bijection validation for S-boxes and permutation layers
   - Key schedule: rotate + XOR with round constants
   - `encryptBlock()` / `decryptBlock()` - main cipher functions with optional step-by-step trace

2. **js/analysis.js** - Avalanche observations → exports `window.ToySPNAnalysis`
   - Avalanche test implementation: measures output bit changes from 1-bit input differences
   - Histogram rendering for distribution visualization
   - Uses the core Web Crypto random source; failure is explicit and there is no Math.random fallback

3. **js/messages.js** - Japanese/English dictionaries and rendering-only language switching
   - Language order: valid ?lang=ja|en, saved preference, browser locale (non-Japanese uses English)
   - Optional localStorage stores only language; storage failure must not break the app
   - Numeric results and inputs must survive language switching without recomputation

4. **js/ui.js** - DOM manipulation & event handling (no exports, self-contained IIFE)
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

State scoped inside the ui.js IIFE:
- `S[]` - current S-box (16 elements)
- `P[]` - current P-layer (16 elements)
- Master key and rounds count read from inputs on-demand

Changes update validation and invalidate dependent results. Analysis snapshots S, P, key, rounds, and trials. A generation counter cancels queued stale work. Catch errors inside the delayed callback. Keep derived UI consistent for input, reset, identity, randomization, sample, IME, and language actions.

Current-setting summaries read the controls without modifying them or running the cipher. Keep them separate from recorded analysis settings. Classify S/P as default, identity, custom, or invalid after bijection checks. Show composing input during IME conversion. Empty-state guidance distinguishes initial, stale, running, error, and complete states. The default sample resets S/P, key, rounds, and plaintext, clears ciphertext/results, keeps trials, and restores initial guidance.

The language button belongs to header actions at the right, separate from centered title content and tabs. On narrow screens, actions occupy their own row above the title. Verify spacing and no overlap in both languages.

Round traces use native details/summary with the first processed round open and all input/output summaries visible. Shared renderSteps receives the exact round-key array used for that operation. Key XOR uses afterP for encryption and before for decryption; afterK is the result. Index keys by round - 1, including reverse-order decryption. Optional binary text is zero-padded to 16 bits, grouped in fours, bit 15 on the left. Display and language controls must not recompute, change values, or discard disclosure state. Input invalidation removes traces and hides their controls. Binary-display preference lasts only for the page lifetime.

## Key Implementation Details

**16-bit constraints:**
- All operations use `& 0xFFFF` masking
- Hex inputs must contain 1–4 digits after trimming; invalid values are rejected, never filtered or truncated
- Rounds are integers 1–16; trials are integers 10–2000
- Bit indices 0-15, nibble indices 0-3

**Permutation semantics:**
`P[i] = j` means bit i moves to position j (output[P[i]] = input[i])

**Default parameters:**
- S-box: `[C,5,6,B,9,0,A,D,3,E,F,8,4,7,1,2]` (hex)
- P-layer: `[0,4,8,12, 1,5,9,13, 2,6,10,14, 3,7,11,15]` (column-major like)
- Rounds: 8
- Master key example: `C0DE`

**Observation limits:** A model with flip probability 1/2 per output bit has mean 8. This tool does not test SAC or security. More rounds do not guarantee more diffusion. A bijection need not be nonlinear. The rotation/XOR key schedule is affine and does not guarantee independent round keys.

## Security Implementation

This project emphasizes XSS prevention as an educational example:
- **No innerHTML** - all dynamic content uses `textContent` and `createElement`
- **Meta CSP** - self-hosted JS/CSS, connect-src 'none', no unsafe-inline/eval. HTTP-only frame-ancestors/XFO cannot be enforced by meta
- **Input validation** - `clampHex16()` requires the complete input to match `/^[0-9a-fA-F]{1,4}$/`

## Educational Context

This is a teaching tool demonstrating how modern block ciphers combine:
1. Substitution (S-box), with nonlinearity depending on the chosen table
2. Permutation (P-layer), which preserves the number of changed bits and redistributes them between S-boxes
3. Key mixing (XOR), which makes the transform key-dependent without proving security

The block and key are only 16 bits (65,536 keys); this is NOT for protecting secrets or for production use.

## Verification and documentation

- Run `npm test` with Node.js 22 or newer. No npm install is required.
- Preserve the default vector: plaintext 1234, key C0DE, 8 rounds → FBC6.
- Preserve the round constants and default tables; verify all 65,536 default plaintexts round-trip.
- Use DOM text APIs, meaningful labels, hidden states, 44px controls, and responsive layouts.
- Check HTTP and file://, Japanese and English, keyboard navigation, errors, and widths 320/390/800/1280.
- Keep README.md metadata unchanged, translate all corresponding sections into README.en.md, and update both screenshot sets.
- Do not describe unimplemented behavior, invented performance gains, or comparisons with past versions.
- Commit each verified stage. Stop and report after two unsuccessful repairs at one gate; never weaken expected results.
