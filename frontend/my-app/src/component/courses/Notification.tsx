import React, { useState, useEffect } from "react";

// 1️⃣ Define allowed notification types
export type NotificationType = "success" | "info" | "warning" | "error";

// 2️⃣ Define the Notification object shape
type NotificationItem = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  duration: number;
};

// 3️⃣ Props for the Notification container
type NotificationContainerProps = {
  notifications: NotificationItem[];
  removeNotification: (id: number) => void;
};

// 4️⃣ Props for the Notification toast itself
type NotificationProps = {
  type: NotificationType;
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
};

// ✅ Notification component
const Notification: React.FC<NotificationProps> = ({
  type = "success",
  title,
  message,
  onClose,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => handleClose(), duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const styles: Record<
    NotificationType,
    { titleColor: string; backgroundColor: string; borderColor: string }
  > = {
    success: {
      titleColor: "#10B981",
      backgroundColor: "#1F2937",
      borderColor: "#10B981",
    },
    info: {
      titleColor: "#3B82F6",
      backgroundColor: "#1F2937",
      borderColor: "#3B82F6",
    },
    warning: {
      titleColor: "#F59E0B",
      backgroundColor: "#1F2937",
      borderColor: "#F59E0B",
    },
    error: {
      titleColor: "#EF4444",
      backgroundColor: "#1F2937",
      borderColor: "#EF4444",
    },
  };

  const currentStyle = styles[type];

  return (
    <div
      style={{
        backgroundColor: currentStyle.backgroundColor,
        borderRadius: "12px",
        padding: "20px 24px",
        marginBottom: "16px",
        width: "460px",
        maxWidth: "90vw",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
        borderLeft: `4px solid ${currentStyle.borderColor}`,
        animation: isExiting
          ? "slideOut 0.3s ease-out forwards"
          : "slideIn 0.3s ease-out",
        position: "relative",
      }}
    >
      <div style={{ marginBottom: "8px" }}>
        <span
          style={{
            color: currentStyle.titleColor,
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.5px",
          }}
        >
          {title}
        </span>
        <span style={{ color: "#9CA3AF", fontSize: "14px", margin: "0 8px" }}>
          •
        </span>
        <span style={{ color: "#E5E7EB", fontSize: "13px", fontWeight: 400 }}>
          {type === "success" && "Données enregistrées"}
          {type === "info" && "Quelques informations à vous communiquer"}
          {type === "warning" && "Attention à ce que vous avez fait"}
          {type === "error" && "Informations non enregistrées, réessayer"}
        </span>
      </div>

      <p
        style={{
          color: "#D1D5DB",
          fontSize: "13px",
          lineHeight: "1.6",
          margin: "0 0 16px 0",
        }}
      >
        {message}
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleClose}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "#F97316",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            padding: "4px 8px",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Ok, fermer
        </button>
      </div>
    </div>
  );
};

// ✅ Notification Container
const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  removeNotification,
}) => (
  <div
    style={{
      position: "fixed",
      bottom: "24px",
      left: "24px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column-reverse",
      gap: "0",
    }}
  >
    {notifications.map((n) => (
      <Notification
        key={n.id}
        type={n.type}
        title={n.title}
        message={n.message}
        duration={n.duration}
        onClose={() => removeNotification(n.id)}
      />
    ))}
  </div>
);

// ✅ Demo Component
const NotificationDemo: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = (
    type: NotificationType,
    title: string,
    message: string
  ) => {
    const id = Date.now();
    setNotifications((prev) => [
      ...prev,
      { id, type, title, message, duration: 5000 },
    ]);
  };

  const removeNotification = (id: number) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  return (
    <div style={{ padding: "2rem" }}>
      <button
        onClick={() =>
          addNotification("success", "Succès", "Opération réussie !")
        }
      >
        ✅ Success
      </button>
      <button
        onClick={() => addNotification("error", "Erreur", "Une erreur est survenue")}
      >
        ❌ Error
      </button>

      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />
    </div>
  );
};

export default NotificationDemo;
