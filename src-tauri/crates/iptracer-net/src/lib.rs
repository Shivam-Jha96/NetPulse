pub mod fallback;
pub mod traits;

#[cfg(target_os = "windows")]
pub mod windows;

use std::sync::Arc;
pub use traits::*;

pub fn create_socket_provider() -> Arc<dyn PlatformSocketProvider> {
    #[cfg(target_os = "windows")]
    {
        Arc::new(windows::WindowsSocketProvider::new())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Arc::new(fallback::FallbackSocketProvider::new())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_socket_provider() {
        let provider = create_socket_provider();
        // Check provider is non-null Arc
        assert!(Arc::strong_count(&provider) >= 1);
    }
}

