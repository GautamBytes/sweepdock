import { Buffer } from 'node:buffer';
import { Cell, CellType } from '@ton/core';

export function libraryReferences(roots) {
  const pending = [...roots],
    seen = new Set(),
    hashes = new Set();
  while (pending.length) {
    const cell = pending.pop(),
      id = cell.hash().toString('hex');
    if (seen.has(id)) continue;
    if (seen.size >= 10000)
      throw new Error('Contract cell graph exceeds limit');
    seen.add(id);
    if (cell.type === CellType.Library)
      hashes.add(cell.bits.substring(8, 256).toString().toLowerCase());
    else pending.push(...cell.refs);
  }
  return [...hashes].sort();
}

export function verifiedLibraries(entries) {
  if (!Array.isArray(entries) || entries.length > 64)
    throw new Error('Invalid library response');
  const result = new Map();
  for (const entry of entries) {
    let cell, hash;
    try {
      if (
        typeof entry.hash !== 'string' ||
        !/^[A-Za-z0-9+/]{43}=$/.test(entry.hash) ||
        typeof entry.data !== 'string' ||
        entry.data.length > 200000
      )
        throw new Error();
      hash = Buffer.from(entry.hash, 'base64').toString('hex');
      cell = Cell.fromBase64(entry.data);
      if (cell.isExotic || cell.hash().toString('hex') !== hash)
        throw new Error();
    } catch {
      throw new Error('Invalid library code or hash mismatch');
    }
    if (result.has(hash)) throw new Error('Duplicate library entry');
    result.set(hash, cell);
  }
  return result;
}

export function dependencyStatus(required, available) {
  const missing = [...new Set(required)]
    .filter((hash) => !available.has(hash))
    .sort();
  return {
    status: missing.length
      ? 'missing_libraries'
      : 'libraries_available_route_unverified',
    missing,
    publicExecutionEnabled: false,
  };
}
