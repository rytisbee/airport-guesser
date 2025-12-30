import React, { useEffect, useState, useCallback } from "react";

export default function AirportWordle() {
  const DAILY_LABEL = "Guess an airport's three-letter code daily!";
  const MAX_GUESSES = 6;

  const [codes, setCodes] = useState([]);
  const [solution, setSolution] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [current, setCurrent] = useState("");
  const [status, setStatus] = useState("playing");
  const [countdown, setCountdown] = useState("");

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  useEffect(() => {
    fetch("/airport codes.csv")
      .then((res) => res.text())
      .then((text) => {
        const list = text
          .split(/\r?\n/)
          .map((l) => l.trim().toUpperCase())
          .filter((c) => /^[A-Z]{3}$/.test(c));
        setCodes(list);

        const epoch = new Date(Date.UTC(2025, 0, 1));
        const today = new Date();
        const dayIndex = Math.floor((today - epoch) / 86400000);
        const todaySolution = list[dayIndex % list.length];
        setSolution(todaySolution);

        const todayISO = today.toISOString().slice(0, 10);
        const storedDate = localStorage.getItem("airportWordleDate");
        if (storedDate === todayISO) {
          const storedGuesses = JSON.parse(
            localStorage.getItem("airportWordleGuesses") || "[]"
          );
          setGuesses(storedGuesses);
          if (storedGuesses.includes(todaySolution)) setStatus("won");
          else if (storedGuesses.length >= MAX_GUESSES) setStatus("lost");
        }
      });
  }, []);

  const submitGuess = useCallback(() => {
    const guess = current.toUpperCase();
    if (guess.length !== 3 || status !== "playing") return;
    if (!codes.includes(guess)) {
      alert(`Airport code "${guess}" does not exist!`);
      setCurrent("");
      return;
    }
    const next = [...guesses, guess];
    setGuesses(next);
    setCurrent("");
    const todayISO = new Date().toISOString().slice(0, 10);
    localStorage.setItem("airportWordleDate", todayISO);
    localStorage.setItem("airportWordleGuesses", JSON.stringify(next));
    if (guess === solution) setStatus("won");
    else if (next.length >= MAX_GUESSES) setStatus("lost");
  }, [current, guesses, codes, solution, status]);

  const handleKey = useCallback(
    (k) => {
      if (status !== "playing") return;
      k = k.toUpperCase();
      if (k === "BACKSPACE") setCurrent((c) => c.slice(0, -1));
      else if (k === "ENTER") submitGuess();
      else if (/^[A-Z]$/.test(k) && current.length < 3) setCurrent((c) => c + k);
    },
    [current, submitGuess, status]
  );

  useEffect(() => {
    if (!isMobile) {
      const onKey = (e) => handleKey(e.key);
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [handleKey, isMobile]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const next = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0
      );
      const diff = next - now.getTime();
      if (diff <= 0) return;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const tileState = (letter, pos, guess) => {
    if (!guess) return "";
    if (solution[pos] === letter) return "correct";
    if (solution.includes(letter)) return "present";
    return "absent";
  };

  const rows = Array.from({ length: MAX_GUESSES }, (_, i) =>
    guesses[i] || (i === guesses.length ? current.padEnd(3) : "   ")
  );

  const getKeyColor = (letter) => {
    let state = null;
    for (const guess of guesses) {
      if (guess.includes(letter)) {
        for (let i = 0; i < 3; i++) {
          if (guess[i] === letter) {
            if (solution[i] === letter) return "#4caf50";
            if (solution.includes(letter)) state = "#ffc107";
            else state = "#c0c0c0";
          }
        }
      }
    }
    return state || "#888";
  };

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        display: "flex",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        padding: 16,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          backgroundColor: "#fafafa",
          width: "90%",
          maxWidth: isMobile ? 400 : 800,
          textAlign: "center",
          minHeight: 600,
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ color: "#333" }}>{DAILY_LABEL}</h2>

        {rows.map((row, r) => (
          <div
            key={r}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 6,
              marginBottom: 6,
            }}
          >
            {row.split("").map((ch, c) => (
              <div
                key={c}
                style={{
                  width: "100%",
                  paddingTop: "100%",
                  position: "relative",
                  border: "2px solid #999",
                  borderRadius: 6,
                  background:
                    r < guesses.length
                      ? tileState(ch, c, guesses[r]) === "correct"
                        ? "#4caf50"
                        : tileState(ch, c, guesses[r]) === "present"
                        ? "#ffc107"
                        : "#c0c0c0"
                      : c < current.length
                      ? "#eee"
                      : "#fff",
                  color: r < guesses.length ? "#fff" : "#000",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontWeight: "bold",
                    fontSize: "1.5em",
                  }}
                >
                  {ch.trim()}
                </div>
              </div>
            ))}
          </div>
        ))}

        <p style={{ fontSize: 14, margin: "12px 0", color: "#333" }}>
          Next airport in: {countdown}
        </p>

        {status !== "playing" && (
          <p style={{ fontWeight: "bold", marginBottom: 12, color: "#333" }}>
            Ah, a shame. The correct code was {solution}!
          </p>
        )}

        {isMobile && (
          <input
            type="text"
            value={current}
            maxLength={3}
            autoFocus
            onChange={(e) => setCurrent(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitGuess();
              else if (e.key === "Backspace") setCurrent((c) => c.slice(0, -1));
            }}
            style={{
              position: "fixed",
              bottom: 10,
              left: "50%",
              transform: "translateX(-50%)",
              width: 120,
              height: 40,
              fontSize: 24,
              textAlign: "center",
              opacity: 0.1,
              zIndex: 9999,
            }}
          />
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(40px, 1fr))",
            gap: 6,
            marginTop: 12,
          }}
        >
          {"QWERTYUIOPASDFGHJKLZXCVBNM".split("").map((k) => (
            <button
              key={k}
              onClick={() => handleKey(k)}
              style={{
                height: 50,
                borderRadius: 6,
                border: "1px solid #999",
                backgroundColor: getKeyColor(k),
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {k}
            </button>
          ))}

          <button
            onClick={() => handleKey("ENTER")}
            style={{
              height: 50,
              borderRadius: 6,
              border: "1px solid #999",
              backgroundColor: "#888",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
              gridColumn: "span 2",
            }}
          >
            ENTER
          </button>

          <button
            onClick={() => handleKey("BACKSPACE")}
            style={{
              height: 50,
              borderRadius: 6,
              border: "1px solid #999",
              backgroundColor: "#888",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
              gridColumn: "span 2",
            }}
          >
            DEL
          </button>
        </div>
      </div>
    </div>
  );
}