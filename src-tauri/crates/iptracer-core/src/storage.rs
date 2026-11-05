use std::sync::{Arc, Mutex};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use crate::error::{AppError, AppResult, ErrorCategory, ErrorCode};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryRecord {
    pub id: i64,
    pub utility: String,
    pub query: String,
    pub result_json: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FavoriteRecord {
    pub id: i64,
    pub utility: String,
    pub title: String,
    pub target: String,
    pub created_at: String,
}

#[derive(Clone)]
pub struct VaultDatabase {
    conn: Arc<Mutex<Connection>>,
}

impl VaultDatabase {
    pub fn open_in_memory() -> AppResult<Self> {
        let conn = Connection::open_in_memory().map_err(|e| {
            AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string())
        })?;
        let vault = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        vault.init_schema()?;
        Ok(vault)
    }

    pub fn open(path: &str) -> AppResult<Self> {
        let conn = Connection::open(path).map_err(|e| {
            AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string())
        })?;
        let vault = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        vault.init_schema()?;
        Ok(vault)
    }

    pub fn init_schema(&self) -> AppResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS history_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                utility TEXT NOT NULL,
                query TEXT NOT NULL,
                result_json TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_history_utility ON history_entries(utility);
            
            CREATE TABLE IF NOT EXISTS preferences (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                utility TEXT NOT NULL,
                title TEXT NOT NULL,
                target TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_favorites_utility ON favorites(utility);",
        ).map_err(|e| {
            AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string())
        })?;
        Ok(())
    }

    pub fn save_history(&self, utility: &str, query: &str, result_json: &str) -> AppResult<i64> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO history_entries (utility, query, result_json) VALUES (?1, ?2, ?3)",
            params![utility, query, result_json],
        ).map_err(|e| {
            AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string())
        })?;
        Ok(conn.last_insert_rowid())
    }

    pub fn get_history(&self, utility: &str, limit: usize) -> AppResult<Vec<HistoryRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, utility, query, result_json, created_at 
             FROM history_entries 
             WHERE utility = ?1 
             ORDER BY id DESC 
             LIMIT ?2",
        ).map_err(|e| {
            AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string())
        })?;

        let rows = stmt.query_map(params![utility, limit as i64], |row| {
            Ok(HistoryRecord {
                id: row.get(0)?,
                utility: row.get(1)?,
                query: row.get(2)?,
                result_json: row.get(3)?,
                created_at: row.get(4)?,
            })
        }).map_err(|e| {
            AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string())
        })?;

        let mut list = Vec::new();
        for item in rows {
            if let Ok(rec) = item {
                list.push(rec);
            }
        }
        Ok(list)
    }

    pub fn set_preference(&self, key: &str, value: &str) -> AppResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO preferences (key, value, updated_at) 
             VALUES (?1, ?2, CURRENT_TIMESTAMP)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
            params![key, value],
        ).map_err(|e| {
            AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string())
        })?;
        Ok(())
    }

    pub fn get_preference(&self, key: &str) -> AppResult<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT value FROM preferences WHERE key = ?1").map_err(|e| {
            AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string())
        })?;

        let mut rows = stmt.query(params![key]).map_err(|e| {
            AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string())
        })?;

        if let Some(row) = rows.next().map_err(|e| {
            AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string())
        })? {
            let val: String = row.get(0).map_err(|e| {
                AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string())
            })?;
            Ok(Some(val))
        } else {
            Ok(None)
        }
    }

    pub fn clear_history(&self, utility: Option<&str>) -> AppResult<()> {
        let conn = self.conn.lock().unwrap();
        if let Some(util) = utility {
            conn.execute("DELETE FROM history_entries WHERE utility = ?1", params![util])
        } else {
            conn.execute("DELETE FROM history_entries", [])
        }.map_err(|e| AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string()))?;
        Ok(())
    }

    pub fn add_favorite(&self, utility: &str, title: &str, target: &str) -> AppResult<i64> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO favorites (utility, title, target) VALUES (?1, ?2, ?3)",
            params![utility, title, target],
        ).map_err(|e| AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string()))?;
        Ok(conn.last_insert_rowid())
    }

    pub fn get_favorites(&self, utility: Option<&str>) -> AppResult<Vec<FavoriteRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut list = Vec::new();
        if let Some(util) = utility {
            let mut stmt = conn.prepare("SELECT id, utility, title, target, created_at FROM favorites WHERE utility = ?1 ORDER BY id DESC")
                .map_err(|e| AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string()))?;
            let rows = stmt.query_map(params![util], |row| {
                Ok(FavoriteRecord {
                    id: row.get(0)?,
                    utility: row.get(1)?,
                    title: row.get(2)?,
                    target: row.get(3)?,
                    created_at: row.get(4)?,
                })
            }).map_err(|e| AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string()))?;
            for r in rows.flatten() {
                list.push(r);
            }
        } else {
            let mut stmt = conn.prepare("SELECT id, utility, title, target, created_at FROM favorites ORDER BY id DESC")
                .map_err(|e| AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string()))?;
            let rows = stmt.query_map([], |row| {
                Ok(FavoriteRecord {
                    id: row.get(0)?,
                    utility: row.get(1)?,
                    title: row.get(2)?,
                    target: row.get(3)?,
                    created_at: row.get(4)?,
                })
            }).map_err(|e| AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string()))?;
            for r in rows.flatten() {
                list.push(r);
            }
        }
        Ok(list)
    }

    pub fn delete_favorite(&self, id: i64) -> AppResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM favorites WHERE id = ?1", params![id])
            .map_err(|e| AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string()))?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vault_storage() {
        let vault = VaultDatabase::open_in_memory().unwrap();
        vault.set_preference("theme", "cyber-dark").unwrap();
        let pref = vault.get_preference("theme").unwrap();
        assert_eq!(pref, Some("cyber-dark".to_string()));

        let id = vault.save_history("ping", "1.1.1.1", "{\"rtt\": 14.2}").unwrap();
        assert!(id > 0);

        let records = vault.get_history("ping", 10).unwrap();
        assert_eq!(records.len(), 1);
        assert_eq!(records[0].query, "1.1.1.1");

        let fav_id = vault.add_favorite("portscan", "Local Dev Server", "127.0.0.1").unwrap();
        assert!(fav_id > 0);

        let favs = vault.get_favorites(Some("portscan")).unwrap();
        assert_eq!(favs.len(), 1);
        assert_eq!(favs[0].title, "Local Dev Server");

        vault.delete_favorite(fav_id).unwrap();
        let favs_after = vault.get_favorites(Some("portscan")).unwrap();
        assert_eq!(favs_after.len(), 0);

        vault.clear_history(None).unwrap();
        let records_after = vault.get_history("ping", 10).unwrap();
        assert_eq!(records_after.len(), 0);
    }
}
