import { useState } from "react";

interface UpdateBannerProps {
  remoteCommit: string;
  onDismiss: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export function UpdateBanner({ remoteCommit, onDismiss, t }: UpdateBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="update-banner" role="status">
      <span className="update-banner-icon">↑</span>
      <p className="update-banner-message">
        {t("update_available", { commit: remoteCommit })}
      </p>
      <button
        className="update-banner-close"
        onClick={() => {
          setVisible(false);
          onDismiss();
        }}
        aria-label={t("update_dismiss")}
      >
        ✕
      </button>
    </div>
  );
}
