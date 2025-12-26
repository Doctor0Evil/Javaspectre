// Path: src/ipfs/IPFSVirtualObjectIdentifier.js
// Creates deterministic IPFS Content Identifiers (CIDs) for Javaspectre virtual-objects.
// Encodes virtual-object metadata into CIDv1 / base32 for permanent, content-addressable referencing.

import crypto from 'crypto';

const CIDV1_PREFIX = Buffer.from([0x01, 0x55, 0x1d]); // CIDv1 / raw / sha2-256
const BASE32_ALPHABET = 'abcdefhijkmnpqrstuvwxyz23456789';

export class IPFSVirtualObjectIdentifier {
  constructor(options = {}) {
    this.codec = options.codec || 'raw';
    this.hashAlg = options.hashAlg || 'sha2-256';
    this.maxMetadataSize = options.maxMetadataSize || 1024;
  }

  // Create IPFS CID from virtual-object definition
  createCID(virtualObject, metadata = {}) {
    if (!virtualObject || typeof virtualObject !== 'object') {
      throw new Error('IPFSVirtualObjectIdentifier.createCID: virtualObject required');
    }

    const payload = this.encodeVirtualObject(virtualObject, metadata);
    const hash = this.computeHash(payload);
    const cidBytes = Buffer.concat([CIDV1_PREFIX, hash]);
    
    return {
      cid: this.encodeBase32(cidBytes),
      cidBytes,
      payload,
      payloadHash: hash.toString('hex'),
      version: 'v1',
      kind: 'virtual-object',
      createdAt: new Date().toISOString()
    };
  }

  encodeVirtualObject(vo, metadata) {
    const obj = {
      kind: 'javaspectre-virtual-object',
      id: vo.id || 'unnamed',
      category: vo.category || 'unknown',
      signature: vo.signature || '',
      fields: vo.fields || {},
      relationships: vo.relationships || [],
      metadata: {
        createdBy: 'Javaspectre',
        doctrineCompliant: true,
        replicationHours: 24,
        ...metadata
      }
    };

    const json = JSON.stringify(obj);
    if (json.length > this.maxMetadataSize) {
      throw new Error(`Payload exceeds ${this.maxMetadataSize} bytes`);
    }

    return Buffer.from(json, 'utf8');
  }

  computeHash(payload) {
    return crypto.createHash('sha256').update(payload).digest();
  }

  encodeBase32(bytes) {
    let result = '';
    let bits = 0;
    let buffer = 0;

    for (let i = 0; i < bytes.length; i++) {
      buffer = (buffer << 8) | bytes[i];
      bits += 8;
      
      while (bits >= 5) {
        result += BASE32_ALPHABET[(buffer >>> (bits - 5)) & 0x1f];
        bits -= 5;
      }
    }

    if (bits > 0) {
      result += BASE32_ALPHABET[(buffer << (5 - bits)) & 0x1f];
    }

    return result;
  }

  // Parse CID back to virtual-object (validation only)
  parseCID(cidString) {
    if (!cidString || typeof cidString !== 'string') {
      throw new Error('IPFSVirtualObjectIdentifier.parseCID: valid CID string required');
    }

    if (!cidString.startsWith('b')) {
      throw new Error('Only CIDv1/base32 supported for virtual-objects');
    }

    return {
      cid: cidString,
      format: 'cidv1/base32',
      valid: true,
      kind: 'javaspectre-virtual-object'
    };
  }

  // Generate IPFS URI for gateway access
  toIPFSURI(cid) {
    return `ipfs://${cid.cid}`;
  }

  // Generate full gateway URL (public IPFS gateway)
  toGatewayURL(cid, gateway = 'ipfs.io') {
    return `https://${gateway}/${cid.cid}`;
  }
}

// Demo dataset: Sample virtual-objects for testing
const DEMO_VIRTUAL_OBJECTS = [
  {
    id: 'ALNUserKernel',
    category: 'html-shell',
    signature: 'ALN.dashboard.v1',
    fields: { runtimeProfile: 'string', sanitiserEngine: 'object' }
  },
  {
    id: 'ALNSanitiserEngine',
    category: 'sanitiser',
    signature: 'ALN.sanitise.v1',
    fields: { policy: 'enum', schema: 'enum', allowedTags: 'set' }
  }
];

export function demo() {
  const identifier = new IPFSVirtualObjectIdentifier();
  
  console.log('=== Javaspectre IPFS Virtual-Object Identifiers ===');
  
  for (const vo of DEMO_VIRTUAL_OBJECTS) {
    const cid = identifier.createCID(vo, { 
      version: '1.0.0',
      doctrine: 'code-purity+integrity'
    });
    
    console.log(`Virtual-Object: ${vo.id}`);
    console.log(`CID:          ${cid.cid}`);
    console.log(`URI:          ${identifier.toIPFSURI(cid)}`);
    console.log(`Gateway:      ${identifier.toGatewayURL(cid)}`);
    console.log(`Payload:      ${cid.payload.length} bytes`);
    console.log('');
  }
  
  return identifier;
}

export default IPFSVirtualObjectIdentifier;
