import nacl from 'tweetnacl'
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util'
import { openDB } from 'idb'

const DB_NAME = 'privatechat-keys'
const STORE_NAME = 'keypairs'
const DB_VERSION = 1

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'uid' })
      }
    },
  })
}

export async function storeKeyPair(uid, keyPair) {
  const db = await getDb()
  await db.put(STORE_NAME, {
    uid,
    publicKey: keyPair.publicKey,
    secretKey: keyPair.secretKey,
    createdAt: Date.now(),
  })
}

export async function getKeyPair(uid) {
  const db = await getDb()
  return db.get(STORE_NAME, uid)
}

export async function deleteKeyPair(uid) {
  const db = await getDb()
  await db.delete(STORE_NAME, uid)
}

export async function hasKeyPair(uid) {
  const db = await getDb()
  const result = await db.get(STORE_NAME, uid)
  return !!result
}

export function generateKeyPair() {
  const keyPair = nacl.box.keyPair()
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
  }
}

export function encryptMessage(text, recipientPublicKey, senderSecretKey) {
  const recipientPub = decodeBase64(recipientPublicKey)
  const senderSecret = decodeBase64(senderSecretKey)
  const nonce = nacl.randomBytes(nacl.box.nonceLength)
  const messageBytes = decodeUTF8(text)
  const encrypted = nacl.box(messageBytes, nonce, recipientPub, senderSecret)

  return {
    encrypted: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
    ephemeralPublicKey: encodeBase64(nacl.box.keyPair().publicKey),
    version: 1,
  }
}

export function decryptMessage(encryptedData, senderPublicKey, recipientSecretKey) {
  try {
    const encrypted = decodeBase64(encryptedData.encrypted)
    const nonce = decodeBase64(encryptedData.nonce)
    const senderPub = decodeBase64(senderPublicKey)
    const recipientSecret = decodeBase64(recipientSecretKey)

    const decrypted = nacl.box.open(encrypted, nonce, senderPub, recipientSecret)
    if (!decrypted) return null

    return encodeUTF8(decrypted)
  } catch {
    return null
  }
}

export function encryptWithSymKey(text, symKey) {
  const key = decodeBase64(symKey)
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
  const messageBytes = decodeUTF8(text)
  const encrypted = nacl.secretbox(messageBytes, nonce, key)

  return {
    encrypted: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
    version: 1,
  }
}

export function decryptWithSymKey(encryptedData, symKey) {
  try {
    const key = decodeBase64(symKey)
    const encrypted = decodeBase64(encryptedData.encrypted)
    const nonce = decodeBase64(encryptedData.nonce)

    const decrypted = nacl.secretbox.open(encrypted, nonce, key)
    if (!decrypted) return null

    return encodeUTF8(decrypted)
  } catch {
    return null
  }
}

export function encryptSymKeyForUser(symKey, recipientPublicKey, senderSecretKey) {
  return encryptMessage(symKey, recipientPublicKey, senderSecretKey)
}

export function decryptSymKeyForUser(encryptedSymKey, senderPublicKey, recipientSecretKey) {
  const decrypted = decryptMessage(encryptedSymKey, senderPublicKey, recipientSecretKey)
  return decrypted
}
