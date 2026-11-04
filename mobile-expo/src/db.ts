import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import {DEFAULT_CATEGORIES} from './types';

export const db = SQLite.openDatabaseSync('bharat_gas_care.db');
export async function initDb() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,mobile TEXT NOT NULL UNIQUE,role TEXT NOT NULL,pin_hash TEXT NOT NULL,active_status INTEGER NOT NULL DEFAULT 1,assigned_location_id INTEGER,current_cash_in_hand REAL NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS locations(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,type TEXT NOT NULL,active_status INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL UNIQUE,weight_kg REAL NOT NULL,base_rate REAL NOT NULL DEFAULT 0,deposit_security_amount REAL NOT NULL DEFAULT 0,active_status INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS stock(location_id INTEGER NOT NULL,category_id INTEGER NOT NULL,filled_cylinders INTEGER NOT NULL DEFAULT 0,empty_cylinders INTEGER NOT NULL DEFAULT 0,defective_cylinders INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(location_id,category_id),FOREIGN KEY(location_id) REFERENCES locations(id),FOREIGN KEY(category_id) REFERENCES categories(id));
    CREATE TABLE IF NOT EXISTS customers(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,mobile TEXT NOT NULL UNIQUE,address TEXT NOT NULL DEFAULT '',pending_empty_dues INTEGER NOT NULL DEFAULT 0,credit_due REAL NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS transactions(id INTEGER PRIMARY KEY AUTOINCREMENT,transaction_id TEXT NOT NULL UNIQUE,timestamp TEXT NOT NULL,type TEXT NOT NULL,executed_by_staff_id INTEGER,source_location_id INTEGER,target_location_id INTEGER,category_id INTEGER,filled_qty INTEGER NOT NULL DEFAULT 0,empty_qty INTEGER NOT NULL DEFAULT 0,rate REAL NOT NULL DEFAULT 0,line_total REAL NOT NULL DEFAULT 0,total_amount REAL NOT NULL DEFAULT 0,payment_mode TEXT,paid_amount REAL NOT NULL DEFAULT 0,balance_due REAL NOT NULL DEFAULT 0,customer_name TEXT,customer_mobile TEXT,customer_address TEXT,remarks TEXT,FOREIGN KEY(executed_by_staff_id) REFERENCES users(id));
    CREATE TABLE IF NOT EXISTS cash_handover_receipts(id INTEGER PRIMARY KEY AUTOINCREMENT,receipt_no TEXT NOT NULL UNIQUE,staff_id INTEGER NOT NULL,admin_id INTEGER NOT NULL,amount REAL NOT NULL,created_at TEXT NOT NULL,staff_cash_after REAL NOT NULL,owner_vault_after REAL NOT NULL);
    CREATE TABLE IF NOT EXISTS agency_vault(id INTEGER PRIMARY KEY CHECK(id=1),balance REAL NOT NULL DEFAULT 0);
    INSERT OR IGNORE INTO agency_vault(id,balance) VALUES(1,0);
    CREATE INDEX IF NOT EXISTS idx_tx_timestamp ON transactions(timestamp);
    CREATE INDEX IF NOT EXISTS idx_tx_staff ON transactions(executed_by_staff_id);
  `);
  for (const c of DEFAULT_CATEGORIES) db.runSync('INSERT OR IGNORE INTO categories(title,weight_kg,base_rate,deposit_security_amount) VALUES(?,?,?,?)',[c.title,c.weight_kg,c.base_rate,c.deposit_security_amount]);
  db.runSync("INSERT OR IGNORE INTO locations(name,type) VALUES('Main Godown','GODOWN')");
}
export async function hashPin(pin:string) { return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,pin); }
export function hasAdmin() { return (db.getFirstSync<{n:number}>("SELECT COUNT(*) n FROM users WHERE role='SUPER_ADMIN'")?.n ?? 0)>0; }
export async function createUser(name:string,mobile:string,pin:string,role:string,locationId:number|null=null) {
  if(!name.trim() || !/^\\d{10}$/.test(mobile) || !/^\\d{4}$/.test(pin)) throw new Error('Name, 10-digit mobile aur 4-digit PIN sahi bharein.');
  const pinHash=await hashPin(pin);
  db.runSync('INSERT INTO users(name,mobile,role,pin_hash,assigned_location_id) VALUES(?,?,?,?,?)',[name.trim(),mobile,role,pinHash,locationId]);
}
export async function login(mobile:string,pin:string) {
  const hash=await hashPin(pin);
  return db.getFirstSync<any>('SELECT id,name,mobile,role,active_status,assigned_location_id,current_cash_in_hand FROM users WHERE mobile=? AND pin_hash=? AND active_status=1',[mobile,hash]);
}
