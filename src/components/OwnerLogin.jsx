import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

function OwnerLogin() {
  const navigate = useNavigate();

  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // OWNER LOGIN
  // =========================================================

  const handleLogin = async () => {
    setError("");
    setMessage("");

    const cleanMobile = mobile.replace(/\D/g, "");
    const cleanPin = pin.trim();

    // -------------------------------------------------------
    // VALIDATE MOBILE
    // -------------------------------------------------------

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError(
        "Please enter a valid 10 digit mobile number."
      );
      return;
    }

    // -------------------------------------------------------
    // VALIDATE PIN
    // PIN MUST CONTAIN:
    // - At least 1 alphabet
    // - At least 1 number
    // - At least 1 special character
    // -------------------------------------------------------

    if (cleanPin.length < 4 || cleanPin.length > 30) {
      setError(
        "PIN must be between 4 and 30 characters."
      );
      return;
    }

    const hasAlphabet = /[A-Za-z]/.test(cleanPin);
    const hasNumber = /[0-9]/.test(cleanPin);
    const hasSpecial = /[^A-Za-z0-9]/.test(cleanPin);

    if (!hasAlphabet || !hasNumber || !hasSpecial) {
      setError(
        "PIN must contain alphabet, number and special character."
      );
      return;
    }

    setLoading(true);

    try {
  const response = await fetch(
    "https://mahaveer-pawn-broker-c32n.vercel.app/api/auth/login",
      // `${API_URL}/api/auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        mobile: cleanMobile,
        pin: cleanPin,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    setError(
      data.message ||
        "Unable to login."
    );

    return;
  }

      // =====================================================
      // LOGIN SUCCESS
      // =====================================================

      sessionStorage.setItem(
        "mahaveerOwnerLoggedIn",
        "true"
      );

      sessionStorage.setItem(
        "mahaveerOwnerMobile",
        cleanMobile
      );

      navigate("/home", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "OWNER LOGIN ERROR:",
        error
      );

      setError(
        "Unable to connect to backend. Make sure the backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      style={{
        minHeight: "100vh",

        display: "flex",

        justifyContent: "center",

        alignItems: "center",

        background: "#f5f5f5",

        padding: "20px",

        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",

          maxWidth: "430px",

          background: "#ffffff",

          borderRadius: "12px",

          padding: "35px",

          boxSizing: "border-box",

          boxShadow:
            "0 8px 30px rgba(0,0,0,0.12)",

          textAlign: "center",
        }}
      >
        {/* =================================================
            LOGO
        ================================================= */}

        <img
          src="/assets/mahaveer-logo.png"
          alt="Mahaveer Pawn Broker"
          style={{
            width: "100px",

            height: "100px",

            objectFit: "contain",

            marginBottom: "15px",
          }}
        />

        {/* =================================================
            TITLE
        ================================================= */}

        <h1
          style={{
            margin: "0 0 8px",

            fontSize: "26px",

            color: "#1f2937",
          }}
        >
          Mahaveer Pawn Broker
        </h1>

        <h2
          style={{
            margin: "0 0 8px",

            fontSize: "20px",

            color: "#333333",
          }}
        >
          Owner Login
        </h2>

        <p
          style={{
            margin: "0 0 25px",

            color: "#777777",

            fontSize: "14px",
          }}
        >
          Authorized owners only
        </p>

        {/* =================================================
            MOBILE NUMBER
        ================================================= */}

        <label
          htmlFor="ownerMobile"
          style={{
            display: "block",

            textAlign: "left",

            marginBottom: "8px",

            fontWeight: "600",
          }}
        >
          Mobile Number
        </label>

        <div
          style={{
            display: "flex",

            alignItems: "center",

            border:
              "1px solid #cccccc",

            borderRadius: "6px",

            overflow: "hidden",

            marginBottom: "18px",
          }}
        >
          <span
            style={{
              padding: "12px",

              background: "#f3f3f3",

              color: "#555555",

              fontWeight: "600",
            }}
          >
            +91
          </span>

          <input
            id="ownerMobile"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="Enter mobile number"
            value={mobile}
            onChange={(event) => {
              const value =
                event.target.value.replace(
                  /\D/g,
                  ""
                );

              setMobile(
                value.slice(0, 10)
              );

              setError("");
              setMessage("");
            }}
            style={{
              flex: 1,

              border: "none",

              outline: "none",

              padding: "12px",

              fontSize: "15px",
            }}
          />
        </div>

        {/* =================================================
            PIN
        ================================================= */}

        <label
          htmlFor="ownerPin"
          style={{
            display: "block",

            textAlign: "left",

            marginBottom: "8px",

            fontWeight: "600",
          }}
        >
          Owner PIN
        </label>

        <input
          id="ownerPin"
          type="password"
          maxLength={30}
          placeholder="Enter PIN"
          value={pin}
          onChange={(event) => {
            const value =
              event.target.value;

            setPin(
              value.slice(0, 30)
            );

            setError("");
            setMessage("");
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !loading
            ) {
              handleLogin();
            }
          }}
          style={{
            width: "100%",

            boxSizing: "border-box",

            padding: "13px",

            border:
              "1px solid #cccccc",

            borderRadius: "6px",

            outline: "none",

            fontSize: "18px",

            textAlign: "center",

            letterSpacing: "2px",

            marginBottom: "10px",
          }}
        />

        {/* PIN REQUIREMENT */}

        <p
          style={{
            margin:
              "0 0 18px",

            fontSize: "12px",

            color: "#777777",

            textAlign: "left",

            lineHeight: "1.5",
          }}
        >
          PIN must contain at least one alphabet,
          one number and one special character.
        </p>

        {/* =================================================
            LOGIN BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",

            padding: "13px",

            border: "none",

            borderRadius: "6px",

            background: "#222222",

            color: "#ffffff",

            fontWeight: "600",

            fontSize: "15px",

            cursor: loading
              ? "not-allowed"
              : "pointer",

            opacity: loading
              ? 0.7
              : 1,
          }}
        >
          {loading
            ? "LOGGING IN..."
            : "LOGIN"}
        </button>

        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {message && (
          <div
            style={{
              marginTop: "15px",

              padding: "10px",

              borderRadius: "5px",

              background: "#e9f8ee",

              color: "#207a3c",

              fontSize: "14px",
            }}
          >
            {message}
          </div>
        )}

        {/* =================================================
            ERROR MESSAGE
        ================================================= */}

        {error && (
          <div
            style={{
              marginTop: "15px",

              padding: "10px",

              borderRadius: "5px",

              background: "#fff0f0",

              color: "#c62828",

              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <p
          style={{
            marginTop: "25px",

            marginBottom: 0,

            fontSize: "12px",

            color: "#999999",
          }}
        >
          Secure owner access
        </p>
      </div>
    </div>
  );
}

export default OwnerLogin;