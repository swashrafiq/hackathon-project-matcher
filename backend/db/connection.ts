import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { getDatabasePath } from './config'

export function openDatabase(databasePath = getDatabasePath()): DatabaseSync {
  mkdirSync(dirname(databasePath), { recursive: true })

  const database = new DatabaseSync(databasePath)
  database.exec('PRAGMA foreign_keys = ON;')
  return database
}
