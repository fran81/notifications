"use client";

import { useEffect, useState } from "react";

export default function Home() {

  const [alerts, setAlerts] = useState<any[]>([]);
  const [lastId, setLastId] = useState(0);

  useEffect(() => {

    if ("Notification" in window) {
      Notification.requestPermission();
    }

    const interval = setInterval(async () => {

      try {
        const res = await fetch("/api/events");
        const data = await res.json();

        data.forEach((e: any) => {

          if (e.id > lastId) {

            // 🔔 Notificación sistema
            if (Notification.permission === "granted") {
              new Notification(e.title, {
                body: e.message || "Nuevo evento",
              });
            }

            // 📢 Banner persistente
            setAlerts(prev => [e, ...prev]);

            setLastId(e.id);
          }

        });

      } catch (err) {
        console.error("Error fetching events", err);
      }

    }, 3000);

    return () => clearInterval(interval);

  }, [lastId]);

  return (
    <div style={{ padding: 20 }}>

      <h1>Notificaciones</h1>

      {alerts.map((a, i) => (
        <div key={i} style={{
          background: "red",
          color: "white",
          padding: 10,
          marginBottom: 10
        }}>
          <b>{a.title}</b>
          <br />
          {a.message}

          <button onClick={() => {
            setAlerts(alerts.filter((_, idx) => idx !== i));
          }}>
            Cerrar
          </button>
        </div>
      ))}

    </div>
  );
}