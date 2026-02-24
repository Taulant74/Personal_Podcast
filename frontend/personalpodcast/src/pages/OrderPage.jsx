import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function OrderPage() {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const { authFetch, isLoggedIn } = useAuth();

  const api = useMemo(() => {
    return axios.create({
      baseURL: "https://localhost:7261",
    });
  }, []);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [nameOnCard, setNameOnCard] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvc, setCvc] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    const id = Number(episodeId);
    if (!id) {
      setMsg("Invalid episode.");
      return;
    }

    try {
      setLoading(true);

      const res = await authFetch("https://localhost:7261/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeId: id }),
      });

      if (res.status === 200) {
        navigate("/");
        return;
      }

      if (res.status === 401) {
        navigate("/login");
        return;
      }

      const text = await res.text().catch(() => "");
      setMsg(text || "Failed to create order.");
    } catch {
      setMsg("Failed to create order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 520, paddingTop: 24 }}>
      <h2 style={{ fontWeight: 900 }}>Order Episode</h2>
      <div style={{ color: "rgba(255,255,255,0.75)", marginBottom: 12 }}>
        Episode ID: {episodeId}
      </div>

      {msg && (
        <div className="alert alert-danger" style={{ marginTop: 12 }}>
          {msg}
        </div>
      )}

      <form
        onSubmit={submit}
        className="card p-4"
        style={{
          background: "#2f2d35",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div className="mb-3">
          <label
            className="form-label"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            Name on card
          </label>
          <input
            className="form-control"
            value={nameOnCard}
            onChange={(e) => setNameOnCard(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label
            className="form-label"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            Card number
          </label>
          <input
            className="form-control"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            inputMode="numeric"
            required
          />
        </div>

        <div className="row g-2">
          <div className="col-6">
            <label
              className="form-label"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              Exp month
            </label>
            <input
              className="form-control"
              value={expMonth}
              onChange={(e) => setExpMonth(e.target.value)}
              inputMode="numeric"
              required
            />
          </div>
          <div className="col-6">
            <label
              className="form-label"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              Exp year
            </label>
            <input
              className="form-control"
              value={expYear}
              onChange={(e) => setExpYear(e.target.value)}
              inputMode="numeric"
              required
            />
          </div>
        </div>

        <div className="mb-3 mt-2">
          <label
            className="form-label"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            CVC
          </label>
          <input
            className="form-control"
            value={cvc}
            onChange={(e) => setCvc(e.target.value)}
            inputMode="numeric"
            required
          />
        </div>

        <button
          className="btn btn-light"
          type="submit"
          disabled={loading}
          style={{ fontWeight: 800 }}
        >
          {loading ? "Processing..." : "Pay & Order"}
        </button>

        <button
          type="button"
          className="btn btn-link"
          onClick={() => navigate(-1)}
          style={{ marginTop: 10, color: "rgba(255,255,255,0.8)" }}
        >
          Back
        </button>
      </form>
    </div>
  );
}
