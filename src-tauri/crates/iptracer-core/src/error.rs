use serde::{Deserialize, Serialize};

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<AppError>,
    pub metadata: ResponseMetadata,
}

impl<T> AppResponse<T> {
    pub fn ok(data: T, duration_ms: f64) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            metadata: ResponseMetadata {
                request_id: uuid::Uuid::new_v4().to_string(),
                timestamp: chrono::Utc::now().timestamp_millis(),
                duration_ms,
                host_platform: std::env::consts::OS.to_string(),
                elevation_required: false,
            },
        }
    }

    pub fn err(error: AppError, duration_ms: f64) -> Self {
        let elevation_required = error.code == ErrorCode::ERR_SOCKET_PRIVILEGE;
        Self {
            success: false,
            data: None,
            error: Some(error),
            metadata: ResponseMetadata {
                request_id: uuid::Uuid::new_v4().to_string(),
                timestamp: chrono::Utc::now().timestamp_millis(),
                duration_ms,
                host_platform: std::env::consts::OS.to_string(),
                elevation_required,
            },
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResponseMetadata {
    pub request_id: String,
    pub timestamp: i64,
    pub duration_ms: f64,
    pub host_platform: String,
    pub elevation_required: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, thiserror::Error)]
#[error("{message} (Code: {code:?})")]
#[serde(rename_all = "camelCase")]
pub struct AppError {
    pub code: ErrorCode,
    pub category: ErrorCategory,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
    pub retryable: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suggested_action: Option<String>,
}

impl AppError {
    pub fn new(code: ErrorCode, category: ErrorCategory, message: impl Into<String>) -> Self {
        let retryable = matches!(
            code,
            ErrorCode::ERR_DNS_TIMEOUT
                | ErrorCode::ERR_GEOIP_DB_MISSING
                | ErrorCode::ERR_RATE_LIMIT_429
                | ErrorCode::ERR_ALL_PROVIDERS_DOWN
                | ErrorCode::ERR_ADAPTER_INACTIVE
                | ErrorCode::ERR_PORT_SCAN_LIMIT
                | ErrorCode::ERR_TIMEOUT
        );

        let suggested_action = match code {
            ErrorCode::ERR_SOCKET_PRIVILEGE => {
                Some("Run application as Administrator / root or grant raw socket capability.".to_string())
            }
            ErrorCode::ERR_DNS_NXDOMAIN => {
                Some("Check target domain spelling and ensure it exists.".to_string())
            }
            ErrorCode::ERR_INVALID_CIDR => {
                Some("Provide a valid CIDR mask (0-32 for IPv4, 0-128 for IPv6).".to_string())
            }
            ErrorCode::ERR_ALL_PROVIDERS_DOWN => {
                Some("Verify local internet connectivity or configure a custom API provider.".to_string())
            }
            _ => None,
        };

        Self {
            code,
            category,
            message: message.into(),
            details: None,
            retryable,
            suggested_action,
        }
    }

    pub fn with_details(mut self, details: serde_json::Value) -> Self {
        self.details = Some(details);
        self
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[allow(non_camel_case_types)]
pub enum ErrorCode {
    ERR_SOCKET_PRIVILEGE,
    ERR_DNS_TIMEOUT,
    ERR_DNS_NXDOMAIN,
    ERR_DNS_SEC_BOGUS,
    ERR_GEOIP_DB_MISSING,
    ERR_RATE_LIMIT_429,
    ERR_ALL_PROVIDERS_DOWN,
    ERR_ADAPTER_INACTIVE,
    ERR_PORT_SCAN_LIMIT,
    ERR_INVALID_CIDR,
    ERR_INVALID_TARGET,
    ERR_TIMEOUT,
    ERR_INTERNAL,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ErrorCategory {
    Network,
    Resolution,
    Geolocation,
    Privilege,
    ThirdParty,
    Validation,
    Storage,
    System,
}
