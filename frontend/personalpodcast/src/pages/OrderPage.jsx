import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE, apiUrl } from "../config/api";

function onlyDigits(s) {
  return (s || "").replace(/\D/g, "");
}

// Luhn algorithm for card validation
function luhnCheck(cardNumberDigits) {
  let sum = 0;
  let shouldDouble = false;

  for (let i = cardNumberDigits.length - 1; i >= 0; i--) {
    let digit = cardNumberDigits.charCodeAt(i) - 48;
    if (digit < 0 || digit > 9) return false;

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function normalizeYear(expYear) {
  const y = onlyDigits(expYear);
  if (y.length === 2) return 2000 + Number(y);
  if (y.length === 4) return Number(y);
  return NaN;
}

export default function OrderPage() {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const { authFetch, isLoggedIn } = useAuth();

  const api = useMemo(() => {
    return axios.create({
      baseURL: API_BASE || undefined,
    });
  }, []);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [nameOnCard, setNameOnCard] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvc, setCvc] = useState("");



  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};

    const name = nameOnCard.trim();
    if (!name) next.nameOnCard = "Name on card is required.";
    else if (name.length < 2) next.nameOnCard = "Please enter a valid name.";

    const cardDigits = onlyDigits(cardNumber);
    if (!cardDigits) next.cardNumber = "Card number is required.";
    else if (cardDigits.length < 13 || cardDigits.length > 19)
      next.cardNumber = "Card number must be 13-19 digits.";
    else if (!luhnCheck(cardDigits))
      next.cardNumber = "Card number is invalid.";

    const m = Number(onlyDigits(expMonth));
    if (!expMonth.trim()) next.expMonth = "Exp month is required.";
    else if (!Number.isFinite(m) || m < 1 || m > 12)
      next.expMonth = "Exp month must be 1-12.";

    const y = normalizeYear(expYear);
    if (!expYear.trim()) next.expYear = "Exp year is required.";
    else if (!Number.isFinite(y) || y < 2000 || y > 2100)
      next.expYear = "Enter a valid year (YY or YYYY).";

    // Expiration check (only if month/year valid)
    if (!next.expMonth && !next.expYear) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-12

      if (y < currentYear || (y === currentYear && m < currentMonth)) {
        next.expYear = "Card is expired.";
      }
    }

    const cvcDigits = onlyDigits(cvc);
    if (!cvcDigits) next.cvc = "CVC is required.";
    else if (!(cvcDigits.length === 3 || cvcDigits.length === 4))
      next.cvc = "CVC must be 3 or 4 digits.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

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

    if (!validate()) {
      setMsg("Please write the correct information in the highlighted fields.");
      return;
    }

    try {
      setLoading(true);

      const res = await authFetch(apiUrl("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeId: id }),
      });

      if (res.status === 200) {
        navigate("/my-episodes");
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

  const inputClass = (key) =>
    `form-control${errors[key] ? " is-invalid" : ""}`;

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
        noValidate
      >
        <div className="mb-3">
          <label className="form-label" style={{ color: "rgba(255,255,255,0.85)" }}>
            Name on card
          </label>
          <input
            className={inputClass("nameOnCard")}
            value={nameOnCard}
            onChange={(e) => setNameOnCard(e.target.value)}
            autoComplete="cc-name"
          />
          {errors.nameOnCard && (
            <div className="invalid-feedback">{errors.nameOnCard}</div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label" style={{ color: "rgba(255,255,255,0.85)" }}>
            Card number
          </label>
          <input
            className={inputClass("cardNumber")}
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
          />
          {errors.cardNumber && (
            <div className="invalid-feedback">{errors.cardNumber}</div>
          )}
        </div>

        <div className="row g-2">
          <div className="col-6">
            <label className="form-label" style={{ color: "rgba(255,255,255,0.85)" }}>
              Exp month
            </label>
            <input
              className={inputClass("expMonth")}
              value={expMonth}
              onChange={(e) => setExpMonth(e.target.value)}
              inputMode="numeric"
              autoComplete="cc-exp-month"
              placeholder="MM"
            />
            {errors.expMonth && (
              <div className="invalid-feedback">{errors.expMonth}</div>
            )}
          </div>

          <div className="col-6">
            <label className="form-label" style={{ color: "rgba(255,255,255,0.85)" }}>
              Exp year
            </label>
            <input
              className={inputClass("expYear")}
              value={expYear}
              onChange={(e) => setExpYear(e.target.value)}
              inputMode="numeric"
              autoComplete="cc-exp-year"
              placeholder="YY or YYYY"
            />
            {errors.expYear && (
              <div className="invalid-feedback">{errors.expYear}</div>
            )}
          </div>
        </div>

        <div className="mb-3 mt-2">
          <label className="form-label" style={{ color: "rgba(255,255,255,0.85)" }}>
            CVC
          </label>
          <input
            className={inputClass("cvc")}
            value={cvc}
            onChange={(e) => setCvc(e.target.value)}
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
          />
          {errors.cvc && <div className="invalid-feedback">{errors.cvc}</div>}
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