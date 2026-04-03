"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [shownIds, setShownIds] = useState<number[]>([]);

  useEffect(() => {
    loadRules();
    const interval = setInterval(fetchEvents, 2000);
    return () => clearInterval(interval);
  }, [shownIds]);

  const loadRules = async () => {
    const res = await fetch("/api/rules");
    const data = await res.json();
    setRules(data);
  };

  const fetchEvents = async () => {
    const res = await fetch("/api/events");
    const data = await res.json();

    setEvents(data);

    data.forEach((e: any) => {
      if (!shownIds.includes(e.id)) {
        showOverlay(e);
        setShownIds(prev => [...prev, e.id]);
      }
    });
  };

  const showOverlay = (e: any) => {
    const div = document.createElement("div");

    div.innerHTML = `
      <b>${e.title}</b><br/>
      ${e.message}
      <br/>
      <button>Cerrar</button>
    `;

    Object.assign(div.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      background: "#c62828",
      color: "white",
      padding: "15px",
      borderRadius: "10px",
      zIndex: "9999"
    });

    div.querySelector("button")?.addEventListener("click", () => {
      div.remove();
    });

    document.body.appendChild(div);
  };

  const saveRules = async () => {
    await fetch("/api/rules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(rules)
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Notificaciones</h1>

      <h2>Reglas</h2>

      {rules.map((r, i) => (
        <div key={i}>
          <input
            value={r.match}
            onChange={(e) => {
              const newRules = [...rules];
              newRules[i].match = e.target.value;
              setRules(newRules);
            }}
          />
          <input
            type="checkbox"
            checked={r.enabled}
            onChange={(e) => {
              const newRules = [...rules];
              newRules[i].enabled = e.target.checked;
              setRules(newRules);
            }}
          />
        </div>
      ))}

      <button onClick={() =>
        setRules([...rules, {
          field: "title",
          match: "",
          enabled: true
        }])
      }>
        + Agregar regla
      </button>

      <br /><br />
      <button onClick={saveRules}>Guardar</button>

      <h2>Eventos</h2>
      <ul>
        {events.map(e => (
          <li key={e.id}>{e.title} - {e.message}</li>
        ))}
      </ul>
    </div>
  );
}