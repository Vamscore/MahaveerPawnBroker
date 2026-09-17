import { useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import OwnerLogin from "./components/OwnerLogin";
import PawnTicketForm from "./components/PawnTicketForm";

/* =========================================================
   INITIAL FORM
========================================================= */

const initialForm = {
  goldWeight: "",
  loanTenure: "1",
  goldPrice: "",
  interestRate: "",
};


/* =========================================================
   MOBILE RESPONSIVE FIX
   Desktop layout is intentionally left unchanged.
   These rules only apply to screens 768px and below.
   ========================================================= */

function ResponsiveMobileStyles() {
  return (
    <style>{`
      @media (max-width: 768px) {
        html,
        body,
        #root {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }

        .site-shell {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }

        .calculator-section {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 16px !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
        }

        .calculator-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) !important;
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          gap: 16px !important;
          box-sizing: border-box !important;
        }

        .calculator-panel,
        .loan-details-panel,
        .side-promo {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
        }

        .input-with-suffix,
        .money-input,
        .rate-input {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
        }

        .input-with-suffix input,
        .money-input input,
        .rate-input input {
          min-width: 0 !important;
          width: 1% !important;
          flex: 1 1 auto !important;
          box-sizing: border-box !important;
        }

        .input-with-suffix span,
        .money-input span,
        .rate-input span {
          flex: 0 0 auto !important;
          white-space: nowrap !important;
        }

        .calculator-panel select {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
        }

        .loan-details-panel {
          overflow: hidden !important;
        }

        .loan-details-panel .detail-block {
          width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
        }

        .loan-details-panel small {
          display: block !important;
          max-width: 100% !important;
          overflow-wrap: anywhere !important;
        }

        .side-promo {
          height: auto !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }

        .side-promo > div:first-child {
          width: 100% !important;
          height: 200px !important;
          min-height: 200px !important;
          flex: 0 0 200px !important;
          box-sizing: border-box !important;
        }

        .side-promo img {
          max-width: 100% !important;
        }

        .side-promo button {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
      }

      @media (max-width: 390px) {
        .calculator-section {
          padding: 12px !important;
        }

        .calculator-grid {
          gap: 12px !important;
        }

        .calculator-panel h2 {
          font-size: 24px !important;
          line-height: 1.15 !important;
        }

        .calculator-panel label {
          font-size: 16px !important;
        }

        .calculator-panel input,
        .calculator-panel select {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }

        .side-promo > div:first-child {
          height: 180px !important;
          min-height: 180px !important;
          flex-basis: 180px !important;
        }
      }
    `}</style>
  );
}

/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <>
      <ResponsiveMobileStyles />
      <Routes>
      {/* OWNER LOGIN */}
      <Route
        path="/"
        element={<OwnerLogin />}
      />

      {/* PROTECTED HOME */}
      <Route
        path="/home"
        element={<ProtectedHome />}
      />

      {/* PROTECTED REMINDER PAGE */}
      <Route
        path="/reminder"
        element={<ProtectedReminder />}
      />

      {/* PROTECTED SUBMITTED PAGE */}
      <Route
        path="/application-submitted"
        element={<ProtectedSubmitted />}
      />

      {/* ANY UNKNOWN URL */}
      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
    </>
  );
}

/* =========================================================
   PROTECTED HOME
========================================================= */

function ProtectedHome() {
  const isLoggedIn =
    sessionStorage.getItem(
      "mahaveerOwnerLoggedIn"
    ) === "true";

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Home />;
}

/* =========================================================
   PROTECTED REMINDER
========================================================= */

function ProtectedReminder() {
  const isLoggedIn =
    sessionStorage.getItem(
      "mahaveerOwnerLoggedIn"
    ) === "true";

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Reminder />;
}

/* =========================================================
   PROTECTED SUBMITTED PAGE
========================================================= */

function ProtectedSubmitted() {
  const isLoggedIn =
    sessionStorage.getItem(
      "mahaveerOwnerLoggedIn"
    ) === "true";

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Submitted />;
}

/* =========================================================
   HOME
========================================================= */

function Home() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ...initialForm,
  });

  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout = () => {
    sessionStorage.removeItem(
      "mahaveerOwnerLoggedIn"
    );

    sessionStorage.removeItem(
      "mahaveerOwnerMobile"
    );

    navigate("/", {
      replace: true,
    });
  };

  /* =======================================================
     UPDATE FORM
  ======================================================= */

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /* =======================================================
     CALCULATIONS
  ======================================================= */

  const goldWeight =
    Number(form.goldWeight) || 0;

  const goldPrice =
    Number(form.goldPrice) || 0;

  const interestRate =
    Number(form.interestRate) || 0;

  const loanTenure =
    Number(form.loanTenure) || 0;

  const loanAmount =
    goldWeight * goldPrice;

  const monthlyInterest =
    loanAmount *
    (interestRate / 100);

  const totalInterest =
    monthlyInterest *
    loanTenure;

  const totalAmountToPay =
    loanAmount +
    totalInterest;

  /* =======================================================
     CURRENCY
  ======================================================= */

  const formatCurrency = (value) => {
    return `₹${Math.round(
      value
    ).toLocaleString("en-IN")}`;
  };

  /* =======================================================
     PAWN TICKET DATA
  ======================================================= */

  const pawnTicketData = {
    ...form,

    principalAmount:
      loanAmount,

    loanAmount:
      loanAmount,

    amountInWords:
      loanAmount > 0
        ? numberToWords(
            loanAmount
          )
        : "",
  };

  /* =======================================================
     HOME UI
  ======================================================= */

  return (
    <div className="site-shell">

      {/* =================================================
          TOP BAR
      ================================================= */}

      <div className="top-bar">

        <div>
          Welcome to{" "}
          <span>
            Mahaveer Pawn Broker
          </span>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >

          {/* LOGOUT ONLY */}

          <button
            type="button"
            onClick={logout}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            LOGOUT
          </button>

        </div>

      </div>

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="main-header">

        <div
          className="logo-space"
          style={{
            width: "auto",
            minWidth: "auto",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: "18px",
          }}
        >

          <img
            src="/assets/Left.png"
            alt="Mahaveer Logo"
            style={{
              width: "105px",
              height: "105px",
              objectFit: "contain",
              display: "block",
            }}
          />

        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "22px",
          }}
        >

          <img
            src="/assets/mahaveer-logo.png"
            alt="Mahaveer"
            style={{
              width: "82px",
              height: "82px",
              objectFit: "contain",
              display: "block",
            }}
          />

          <div className="header-contact">

            <div className="phone-icon">
              ☎
            </div>

            <div>

              <span>
                Call Us Now
              </span>

              <strong>
                94404 82058
              </strong>

            </div>

          </div>

        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main>

        {/* =================================================
            HERO
        ================================================= */}

        <section className="hero">

          <div className="hero-copy">

            <h1>
              MAHAVEER
              <br />

              <span>
                Pawn Broker
              </span>
            </h1>

            <div className="gold-line" />

            <div className="hero-features">

              <Feature
                icon="▣"
                text="High Loan Amount"
              />

              <Feature
                icon="▤"
                text="Minimal Documentation"
              />

              <Feature
                icon="◉"
                text="Low Interest Rate"
              />

              <Feature
                icon="◇"
                text="Quick Disbursal"
              />

            </div>

          </div>

          <div className="hero-image-wrap">

            <img
              src="/assets/gold-hero.jpg"
              alt="Gold jewellery"
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";
              }}
            />

            <img
              src="/assets/gold-hero.png"
              alt="Gold Loans"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />

            <div className="value-badge">

              <div>
                ★★★★★
              </div>

              <strong>
                Highest Value
              </strong>

              <span>
                for Your
                <br />
                Gold
              </span>

            </div>

          </div>

        </section>

        {/* =================================================
            LOAN CALCULATOR
        ================================================= */}

        <section
          id="loan-form"
          className="calculator-section"
        >

          <div
            className="calculator-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr 1fr",
              width: "100%",
              alignItems: "stretch",
            }}
          >

            {/* =================================================
                CALCULATOR PANEL
            ================================================= */}

            <div
              className="calculator-panel"
              style={{
                width: "100%",
                boxSizing: "border-box",
              }}
            >

              <h2>
                GOLD LOAN{" "}
                <span>
                  CALCULATOR
                </span>
              </h2>

              <div className="small-gold-line" />

              {/* GOLD WEIGHT */}

              <label htmlFor="goldWeight">
                Enter Gold Weight
              </label>

              <div
                className="input-with-suffix"
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >

                <input
                  id="goldWeight"
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter gold weight"
                  value={form.goldWeight}
                  onChange={(event) =>
                    updateField(
                      "goldWeight",
                      event.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    border:
                      "1px solid #8b9caf",
                    borderRadius: "4px",
                    outline: "none",
                  }}
                />

                <span>
                  grams
                </span>

              </div>

              {/* LOAN TENURE */}

              <label htmlFor="loanTenure">
                Loan Tenure
              </label>

              <select
                id="loanTenure"
                value={form.loanTenure}
                onChange={(event) =>
                  updateField(
                    "loanTenure",
                    event.target.value
                  )
                }
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border:
                    "1px solid #8b9caf",
                  borderRadius: "4px",
                  outline: "none",
                }}
              >

                {Array.from(
                  {
                    length: 24,
                  },
                  (_, index) =>
                    index + 1
                ).map((month) => (

                  <option
                    key={month}
                    value={month}
                  >
                    {month} Month
                    {month > 1
                      ? "s"
                      : ""}
                  </option>

                ))}

              </select>

              {/* GOLD PRICE */}

              <label
                htmlFor="goldPrice"
                style={{
                  marginTop: "22px",
                }}
              >
                Gold Price Per Gram
              </label>

              <div
                className="money-input"
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  boxSizing: "border-box",
                  border:
                    "1px solid #8b9caf",
                  borderRadius: "4px",
                  padding: "0 12px",
                }}
              >

                <span>
                  ₹
                </span>

                <input
                  id="goldPrice"
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter gold price"
                  value={form.goldPrice}
                  onChange={(event) =>
                    updateField(
                      "goldPrice",
                      event.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    background:
                      "transparent",
                  }}
                />

              </div>

              <small
                style={{
                  display: "block",
                  marginTop: "6px",
                }}
              >
                Enter current gold price
                per gram
              </small>

              {/* INTEREST RATE */}

              <label
                htmlFor="interestRate"
                style={{
                  marginTop: "18px",
                }}
              >
                Interest Rate
              </label>

              <div
                className="rate-input"
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  boxSizing: "border-box",
                  border:
                    "1px solid #8b9caf",
                  borderRadius: "4px",
                  padding: "0 12px",
                }}
              >

                <input
                  id="interestRate"
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter interest rate"
                  value={form.interestRate}
                  onChange={(event) =>
                    updateField(
                      "interestRate",
                      event.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    background:
                      "transparent",
                  }}
                />

                <span>
                  %
                </span>

              </div>

              <small
                style={{
                  display: "block",
                  marginTop: "6px",
                }}
              >
                per month
              </small>

            </div>

            {/* =================================================
                LOAN DETAILS
            ================================================= */}

            <div
              className="loan-details-panel"
              style={{
                width: "100%",
                boxSizing: "border-box",
              }}
            >

              <div className="detail-block">

                <label>
                  LOAN AMOUNT
                </label>

                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    marginTop: "8px",
                  }}
                >
                  {formatCurrency(
                    loanAmount
                  )}
                </div>

                <small>
                  Calculated from gold weight
                  × gold price
                </small>

              </div>

              <div className="detail-divider" />

              <div className="detail-block">

                <label>
                  MONTHLY INTEREST
                </label>

                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    marginTop: "8px",
                  }}
                >
                  {formatCurrency(
                    monthlyInterest
                  )}
                </div>

                <small>
                  Based on entered interest
                  rate
                </small>

              </div>

              <div className="detail-divider" />

              <div className="detail-block">

                <label>
                  TOTAL INTEREST
                </label>

                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    marginTop: "8px",
                  }}
                >
                  {formatCurrency(
                    totalInterest
                  )}
                </div>

                <small>
                  For {loanTenure} month
                  {loanTenure > 1
                    ? "s"
                    : ""}
                </small>

              </div>

              <div className="detail-divider" />

              <div className="detail-block">

                <label>
                  TOTAL AMOUNT TO PAY
                </label>

                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "800",
                    marginTop: "8px",
                  }}
                >
                  {formatCurrency(
                    totalAmountToPay
                  )}
                </div>

                <small>
                  Loan amount + total
                  interest
                </small>

              </div>

            </div>

            {/* =================================================
                PROMO IMAGE + REMINDER BUTTON
                FIXED SO BOTH ARE ALWAYS VISIBLE
            ================================================= */}

            <div
              className="side-promo"
              style={{
                width: "100%",
                height: "100%",
                minHeight: "0",
                boxSizing: "border-box",
                overflow: "hidden",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                background: "#ffffff",
              }}
            >

              {/* =================================================
                  PROMO IMAGE
              ================================================= */}

              <div
                style={{
                  width: "100%",
                  height: "390px",
                  minHeight: "390px",
                  flex: "0 0 390px",
                  overflow: "hidden",
                  position: "relative",
                  borderRadius: "8px",
                  background: "#f5f5f5",
                }}
              >

                <img
                  src="/assets/gold-loan-banner.png"
                  alt="Gold jewellery"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    display: "block",
                  }}
                />

              </div>

              {/* =================================================
                  REMINDER BUTTON
              ================================================= */}

              <button
                type="button"
                onClick={() =>
                  navigate("/reminder")
                }
                style={{
                  width: "100%",
                  height: "52px",
                  minHeight: "52px",
                  marginTop: "12px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#001a35",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  transition:
                    "background 0.2s ease, transform 0.2s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background =
                    "#002b57";

                  event.currentTarget.style.transform =
                    "translateY(-1px)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background =
                    "#001a35";

                  event.currentTarget.style.transform =
                    "translateY(0)";
                }}
              >
                REMINDER
              </button>

            </div>

          </div>

        </section>

        {/* =================================================
            PAWN TICKET FORM
        ================================================= */}

        <PawnTicketForm
          loanData={pawnTicketData}
          onLoanDataChange={
            updateField
          }
        />

      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="site-footer">

        <div className="footer-container">

          <div className="footer-left">

            <h3>
              MAHAVEER Pawn Broker <br />
               Estd. 2004
            </h3>

            <p>
              18-4-126A, Railway Colony Ext.
            </p>

            <p>
              Tirupati – 517501
            </p>

          </div>

          <div className="footer-right">

            <p className="footer-contact">

              <strong>
                Contact:
              </strong>

              <span>
                94404 82058
              </span>

            </p>

          </div>

        </div>

        <div className="footer-bottom">

          <p>
            © {new Date().getFullYear()}{" "}
            Mahaveer Pawn Broker.
            All Rights Reserved.
          </p>

        </div>

      </footer>

    </div>
  );
}

/* =========================================================
   REMINDER PAGE
========================================================= */

function Reminder() {
  const navigate = useNavigate();

  const [messageForm, setMessageForm] = useState({
    ticketNumber: "",
    customerNumber: "",
    description: "",
  });

  /* =======================================================
     UPDATE MESSAGE FIELD
  ======================================================= */

  const updateMessageField = (
    field,
    value
  ) => {
    setMessageForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /* =======================================================
     REMINDER MESSAGE
  ======================================================= */

  const reminderMessage =
    `Mahaveer Pawn Broker Reminder\n\n` +
    `Ticket Number: ${
      messageForm.ticketNumber || "-"
    }\n` +
    `Description: ${
      messageForm.description || "-"
    }\n\n` +
    `Please contact Mahaveer Pawn Broker for more details.`;

  /* =======================================================
     VALIDATE NUMBER
  ======================================================= */

  const getCustomerNumber = () => {
    const number =
      messageForm.customerNumber.replace(
        /\D/g,
        ""
      );

    if (number.length !== 10) {
      window.alert(
        "Please enter a valid 10 digit customer number."
      );

      return null;
    }

    return number;
  };

  /* =======================================================
     SEND WHATSAPP
  ======================================================= */

  const sendWhatsAppReminder = () => {
    const number =
      getCustomerNumber();

    if (!number) {
      return;
    }

    const whatsappUrl =
      `https://wa.me/91${number}?text=${encodeURIComponent(
        reminderMessage
      )}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* =======================================================
     SEND SMS
  ======================================================= */

  const sendSmsReminder = () => {
    const number =
      getCustomerNumber();

    if (!number) {
      return;
    }

    const smsUrl =
      `sms:+91${number}?body=${encodeURIComponent(
        reminderMessage
      )}`;

    window.location.href =
      smsUrl;
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout = () => {
    sessionStorage.removeItem(
      "mahaveerOwnerLoggedIn"
    );

    sessionStorage.removeItem(
      "mahaveerOwnerMobile"
    );

    navigate("/", {
      replace: true,
    });
  };

  /* =======================================================
     REMINDER UI
  ======================================================= */

  return (
    <div className="site-shell">

      {/* =================================================
          TOP BAR
      ================================================= */}

      <div className="top-bar">

        <div>
          Welcome to{" "}
          <span>
            Mahaveer Pawn Broker
          </span>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: "10px",
          }}
        >

          <button
            type="button"
            onClick={() =>
              navigate("/home")
            }
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              background: "#e7ad36",
              color: "#001a35",
              fontWeight: "700",
            }}
          >
            HOME
          </button>

          <button
            type="button"
            onClick={logout}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            LOGOUT
          </button>

        </div>

      </div>

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="main-header">

        <div
          className="logo-space"
          style={{
            width: "auto",
            minWidth: "auto",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >

          <img
            src="/assets/Left.png"
            alt="Mahaveer Logo"
            style={{
              width: "105px",
              height: "105px",
              objectFit: "contain",
              display: "block",
            }}
          />

        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "22px",
          }}
        >

          <img
            src="/assets/mahaveer-logo.png"
            alt="Mahaveer"
            style={{
              width: "82px",
              height: "82px",
              objectFit: "contain",
              display: "block",
            }}
          />

          <div className="header-contact">

            <div className="phone-icon">
              ☎
            </div>

            <div>

              <span>
                Call Us Now
              </span>

              <strong>
                94404 82058
              </strong>

            </div>

          </div>

        </div>

      </header>

      {/* =================================================
          REMINDER CONTENT
      ================================================= */}

      <main>

        <section
          style={{
            width: "89%",
            maxWidth: "1600px",
            margin: "50px auto",
            padding: "35px",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "8px",
            boxShadow:
              "0 7px 25px rgba(0, 0, 0, 0.08)",
            boxSizing: "border-box",
          }}
        >

          <h1
            style={{
              margin: 0,
              color: "#001a35",
              fontSize: "28px",
            }}
          >
            CUSTOMER REMINDER
          </h1>

          <div
            style={{
              width: "40px",
              height: "3px",
              margin: "12px 0 25px",
              background: "#e7ad36",
            }}
          />

          <p
            style={{
              color: "#666",
              marginBottom: "28px",
            }}
          >
            Enter the customer's details.
          </p>

          {/* FORM */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "20px",
            }}
          >

            {/* TICKET NUMBER */}

            <div>

              <label
                htmlFor="messageTicketNumber"
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#333",
                }}
              >
                Ticket Number
              </label>

              <input
                id="messageTicketNumber"
                type="text"
                placeholder="Enter ticket number"
                value={
                  messageForm.ticketNumber
                }
                onChange={(event) =>
                  updateMessageField(
                    "ticketNumber",
                    event.target.value
                  )
                }
                style={{
                  width: "100%",
                  height: "45px",
                  padding: "0 12px",
                  border:
                    "1px solid #999",
                  borderRadius: "4px",
                  outline: "none",
                  boxSizing:
                    "border-box",
                }}
              />

            </div>

            {/* CUSTOMER NUMBER */}

            <div>

              <label
                htmlFor="messageCustomerNumber"
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#333",
                }}
              >
                Customer Number
              </label>

              <input
                id="messageCustomerNumber"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter 10 digit mobile number"
                value={
                  messageForm.customerNumber
                }
                onChange={(event) =>
                  updateMessageField(
                    "customerNumber",
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10)
                  )
                }
                style={{
                  width: "100%",
                  height: "45px",
                  padding: "0 12px",
                  border:
                    "1px solid #999",
                  borderRadius: "4px",
                  outline: "none",
                  boxSizing:
                    "border-box",
                }}
              />

            </div>

            {/* DESCRIPTION */}

            <div
              style={{
                gridColumn:
                  "1 / -1",
              }}
            >

              <label
                htmlFor="messageDescription"
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#333",
                }}
              >
                Description
              </label>

              <textarea
                id="messageDescription"
                rows={5}
                placeholder="Enter reminder details..."
                value={
                  messageForm.description
                }
                onChange={(event) =>
                  updateMessageField(
                    "description",
                    event.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding:
                    "11px 12px",
                  border:
                    "1px solid #999",
                  borderRadius: "4px",
                  outline: "none",
                  resize: "vertical",
                  boxSizing:
                    "border-box",
                  fontFamily:
                    "inherit",
                }}
              />

            </div>

          </div>

          {/* BUTTONS */}

          <div
            style={{
              display: "flex",
              gap: "14px",
              marginTop: "25px",
              flexWrap: "wrap",
            }}
          >

            <button
              type="button"
              onClick={
                sendWhatsAppReminder
              }
              style={{
                border: 0,
                borderRadius: "4px",
                padding:
                  "14px 28px",
                background:
                  "#25D366",
                color: "#fff",
                fontWeight:
                  "700",
                fontSize: "12px",
                cursor:
                  "pointer",
              }}
            >
              SEND WHATSAPP
            </button>

            <button
              type="button"
              onClick={
                sendSmsReminder
              }
              style={{
                border: 0,
                borderRadius: "4px",
                padding:
                  "14px 28px",
                background:
                  "#001a35",
                color: "#fff",
                fontWeight:
                  "700",
                fontSize: "12px",
                cursor:
                  "pointer",
              }}
            >
              SEND SMS
            </button>

          </div>

          <p
            style={{
              margin:
                "15px 0 0",
              color: "#777",
              fontSize: "11px",
            }}
          >
            &#x20;
          </p>

        </section>

      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="site-footer">

        <div className="footer-container">

          <div className="footer-left">

            <h3>
              MAHAVEER Pawn Broker
            </h3>

            <p>
              18-4-126A, Railway Colony Ext.
            </p>

            <p>
              Tirupati – 517501
            </p>

          </div>

          <div className="footer-right">

            <p className="footer-contact">

              <strong>
                Contact:
              </strong>

              <span>
                94404 82058
              </span>

            </p>

          </div>

        </div>

        <div className="footer-bottom">

          <p>
            © {new Date().getFullYear()}{" "}
            Mahaveer Pawn Broker.
            All Rights Reserved.
          </p>

        </div>

      </footer>

    </div>
  );
}

/* =========================================================
   FEATURE
========================================================= */

function Feature({
  icon,
  text,
}) {
  return (
    <div className="feature">

      <span className="feature-icon">
        {icon}
      </span>

      <span>
        {text}
      </span>

    </div>
  );
}

/* =========================================================
   NUMBER TO WORDS
========================================================= */

function numberToWords(number) {
  const value = Math.floor(
    Number(number) || 0
  );

  if (value === 0) {
    return "Zero Rupees Only";
  }

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertBelowThousand(num) {
    let result = "";

    if (num >= 100) {
      result +=
        ones[
          Math.floor(num / 100)
        ] +
        " Hundred ";

      num %= 100;
    }

    if (num >= 20) {
      result +=
        tens[
          Math.floor(num / 10)
        ];

      if (num % 10) {
        result +=
          " " +
          ones[num % 10];
      }

    } else if (num > 0) {
      result += ones[num];
    }

    return result.trim();
  }

  let result = "";

  const crore =
    Math.floor(
      value / 10000000
    );

  const lakh =
    Math.floor(
      (value % 10000000) /
        100000
    );

  const thousand =
    Math.floor(
      (value % 100000) /
        1000
    );

  const remainder =
    value % 1000;

  if (crore) {
    result +=
      convertBelowThousand(
        crore
      ) +
      " Crore ";
  }

  if (lakh) {
    result +=
      convertBelowThousand(
        lakh
      ) +
      " Lakh ";
  }

  if (thousand) {
    result +=
      convertBelowThousand(
        thousand
      ) +
      " Thousand ";
  }

  if (remainder) {
    result +=
      convertBelowThousand(
        remainder
      );
  }

  return (
    result.trim() +
    " Rupees Only"
  );
}

/* =========================================================
   SUBMITTED PAGE
========================================================= */

function Submitted() {
  return (
    <div className="submitted-page">

      <div className="submitted-card">

        <div className="submitted-check">
          ✓
        </div>

        <h1>
          Application Saved
        </h1>

        <p>
          Your gold loan application
          has been saved successfully.
        </p>

        <a
          href="/home"
          className="secondary-button"
        >
          BACK TO HOME
        </a>

      </div>

    </div>
  );
}

/* =========================================================
   EXPORT
========================================================= */

export default App;