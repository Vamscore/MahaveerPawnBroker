import { useState } from "react";

const API_URL =
  "https://mahaveer-pawn-broker-c32n.vercel.app/api/pawn-tickets";

/* =========================================================
   TODAY'S DATE
========================================================= */

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* =========================================================
   NUMBER TO WORDS
========================================================= */

function numberToWords(number) {
  const value = Math.floor(Number(number) || 0);

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
      result += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }

    if (num >= 20) {
      result += tens[Math.floor(num / 10)];

      if (num % 10) {
        result += ` ${ones[num % 10]}`;
      }
    } else if (num > 0) {
      result += ones[num];
    }

    return result.trim();
  }

  let result = "";

  const crore = Math.floor(value / 10000000);
  const lakh = Math.floor((value % 10000000) / 100000);
  const thousand = Math.floor((value % 100000) / 1000);
  const remainder = value % 1000;

  if (crore) {
    result += `${convertBelowThousand(crore)} Crore `;
  }

  if (lakh) {
    result += `${convertBelowThousand(lakh)} Lakh `;
  }

  if (thousand) {
    result += `${convertBelowThousand(thousand)} Thousand `;
  }

  if (remainder) {
    result += convertBelowThousand(remainder);
  }

  return `${result.trim()} Rupees Only`;
}

/* =========================================================
   IMAGE UPLOAD HELPER
   Compresses selected photos before sending them to backend.
========================================================= */
function imageFileToDataUrl(file, maxSize = 1400, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select an image file."));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        let width = image.width;
        let height = image.height;

        const scale = Math.min(
          1,
          maxSize / Math.max(width, height)
        );

        width = Math.round(width * scale);
        height = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Unable to process the image."));
          return;
        }

        context.drawImage(image, 0, 0, width, height);

        resolve(
          canvas.toDataURL("image/jpeg", quality)
        );
      };

      image.onerror = () => {
        reject(new Error("Unable to read the selected image."));
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      reject(new Error("Unable to read the selected image."));
    };

    reader.readAsDataURL(file);
  });
}

/* =========================================================
   INITIAL TICKET
========================================================= */

const initialTicket = {
  ticketNumber: "",
  ticketDate: getTodayDate(),

  customerName: "",
  fatherHusbandName: "",
  fullAddress: "",

  principalAmount: "",
  amountInWords: "",

  redemptionTime: "1 Year",

  particulars: "",
  customerId: "",
  annualIncome: "",

  grossKg: "",
  grossG: "",
  grossMg: "",
  grossPv: "",

  netKg: "",
  netG: "",
  netMg: "",
  netPv: "",

  personPhoto: "",
  jewelleryPhoto: "",

  declarationAccepted: false,
};

/* =========================================================
   PAWN TICKET FORM
========================================================= */

function PawnTicketForm({ loanData = {} }) {
  /* =======================================================
     CALCULATOR DATA
  ======================================================= */

  const calculatedLoanAmount = Number(loanData.loanAmount) || 0;

  const calculatorGoldWeight = loanData.goldWeight || "";

  /* =======================================================
     TICKET STATE
  ======================================================= */

  const [ticket, setTicket] = useState(() => ({
    ...initialTicket,

    ticketDate: getTodayDate(),

    grossG: calculatorGoldWeight,

    principalAmount:
      calculatedLoanAmount > 0
        ? String(calculatedLoanAmount)
        : "",

    amountInWords:
      calculatedLoanAmount > 0
        ? numberToWords(calculatedLoanAmount)
        : "",
  }));

  /* =======================================================
     SAVE STATE
  ======================================================= */

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  /* =======================================================
     CUSTOMER HISTORY
  ======================================================= */

  const [customerHistory, setCustomerHistory] = useState([]);

  const [historyLoading, setHistoryLoading] = useState(false);

  const [historyMessage, setHistoryMessage] = useState("");

  const [showHistory, setShowHistory] = useState(false);

  const [isNewCustomer, setIsNewCustomer] = useState(false);

  const [paymentMessage, setPaymentMessage] = useState("");

  const [markingPaidId, setMarkingPaidId] = useState("");

  /* =======================================================
     SAVED TICKET ID
  ======================================================= */

  const [savedTicketId, setSavedTicketId] = useState("");

  /* =======================================================
     UPDATE TICKET
  ======================================================= */

  const updateTicket = (field, value) => {
    setTicket((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === "customerId") {
      const customerId = value.trim();

      setCustomerHistory([]);
      setHistoryMessage("");
      setPaymentMessage("");
      setShowHistory(false);
      setIsNewCustomer(false);

      if (!customerId) {
        setShowHistory(false);
      }
    }
  };

  /* =======================================================
     PERSON + JEWELLERY PHOTO UPLOAD
  ======================================================= */
  const handleImageChange = async (field, file) => {
    if (!file) return;

    setMessage("");

    try {
      const dataUrl = await imageFileToDataUrl(file);

      setTicket((current) => ({
        ...current,
        [field]: dataUrl,
      }));
    } catch (error) {
      console.error("IMAGE PROCESSING ERROR:", error);
      setMessage(
        error.message || "Unable to process the selected image."
      );
    }
  };

  /* =======================================================
     SEARCH CUSTOMER HISTORY
  ======================================================= */

  const searchCustomerHistory = async () => {
    const customerId = ticket.customerId.trim();

    if (!customerId) {
      setHistoryMessage("Please enter Customer ID first.");
      setCustomerHistory([]);
      setShowHistory(true);
      setIsNewCustomer(false);
      return;
    }

    setHistoryLoading(true);
    setHistoryMessage("");
    setPaymentMessage("");
    setCustomerHistory([]);
    setShowHistory(false);
    setIsNewCustomer(false);

    try {
      const response = await fetch(
        `${API_URL}/customer/${encodeURIComponent(customerId)}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to find customer history."
        );
      }

      const loans = Array.isArray(result.tickets)
        ? result.tickets
        : [];

      setCustomerHistory(loans);
      setShowHistory(true);

      if (result.isNewCustomer || loans.length === 0) {
        setIsNewCustomer(true);

        setHistoryMessage(
          "New customer. No previous loans found."
        );
      } else {
        setIsNewCustomer(false);

        setHistoryMessage(
          `Existing customer. ${loans.length} previous loan${
            loans.length === 1 ? "" : "s"
          } found.`
        );
      }
    } catch (error) {
      console.error("CUSTOMER HISTORY ERROR:", error);

      setCustomerHistory([]);
      setShowHistory(true);
      setIsNewCustomer(false);

      setHistoryMessage(
        "Customer history could not be loaded. Please try again."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  /* =======================================================
     MARK LOAN AS PAID
     
     IMPORTANT:
     THIS FUNCTION IS DECLARED ONLY ONCE.
  ======================================================= */

  const markLoanAsPaid = async (loan) => {
    if (!loan || !loan.id) {
      setPaymentMessage("Unable to identify this loan.");
      return;
    }

    const currentStatus = String(
      loan.paymentStatus || "ACTIVE"
    ).toUpperCase();

    if (currentStatus === "PAID") {
      setPaymentMessage("This loan is already marked as paid.");
      return;
    }

    const confirmPayment = window.confirm(
      `Are you sure you want to mark loan ${loan.id} as PAID?`
    );

    if (!confirmPayment) {
      return;
    }

    setMarkingPaidId(loan.id);
    setPaymentMessage("");

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(loan.id)}/paid`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentStatus: "PAID",
          }),
        }
      );

      let result = {};

      try {
        result = await response.json();
      } catch (jsonError) {
        console.warn("Payment response was not JSON:", jsonError);
      }

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to mark loan as paid."
        );
      }

      const updatedLoan = result.ticket;

      setCustomerHistory((currentLoans) =>
        currentLoans.map((currentLoan) =>
          currentLoan.id === loan.id
            ? {
                ...currentLoan,
                ...(updatedLoan || {}),
                paymentStatus: "PAID",
                paidAt:
                  updatedLoan?.paidAt ||
                  new Date().toISOString(),
              }
            : currentLoan
        )
      );

      setPaymentMessage(
        `Loan ${loan.id} has been successfully marked as PAID.`
      );
    } catch (error) {
      console.error("MARK LOAN AS PAID ERROR:", error);

      setPaymentMessage(
        error.message || "Unable to mark loan as paid."
      );
    } finally {
      setMarkingPaidId("");
    }
  };

  /* =======================================================
     SAVE APPLICATION
  ======================================================= */

  const handleSave = async () => {
    setMessage("");

    if (!ticket.declarationAccepted) {
      setMessage(
        "Please accept the declaration before saving the application."
      );
      return;
    }

    if (calculatedLoanAmount <= 0) {
      setMessage(
        "Please enter gold weight and gold price in the Gold Loan Calculator."
      );
      return;
    }

    if (!ticket.customerId.trim()) {
      setMessage("Please enter Customer ID before saving.");
      return;
    }

    setSaving(true);

    const completeApplication = {
      ...loanData,
      ...ticket,

      customerId: ticket.customerId.trim(),

      goldWeight: calculatorGoldWeight,

      grossG: calculatorGoldWeight,

      principalAmount: calculatedLoanAmount,

      loanAmount: calculatedLoanAmount,

      amountInWords: numberToWords(calculatedLoanAmount),

      declarationAccepted: true,

      paymentStatus: "ACTIVE",

      paidAt: null,

      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(completeApplication),
      });

      let result = {};

      try {
        result = await response.json();
      } catch (jsonError) {
        console.warn("Save response was not JSON:", jsonError);
      }

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to save application."
        );
      }

      const newTicketId =
        result.id ||
        result.ticket?.id ||
        "";

      setSavedTicketId(newTicketId);

      if (
        newTicketId &&
        !ticket.ticketNumber.trim()
      ) {
        setTicket((current) => ({
          ...current,
          ticketNumber: newTicketId,
        }));
      }

      setMessage(
        `Application saved successfully. Ticket ID: ${
          newTicketId || "-"
        }`
      );

      /* =====================================================
         REFRESH CUSTOMER HISTORY
      ===================================================== */

      try {
        const customerId = ticket.customerId.trim();

        const historyResponse = await fetch(
          `${API_URL}/customer/${encodeURIComponent(customerId)}`
        );

        if (historyResponse.ok) {
          const historyResult =
            await historyResponse.json();

          const loans = Array.isArray(
            historyResult.tickets
          )
            ? historyResult.tickets
            : [];

          setCustomerHistory(loans);
          setShowHistory(true);
          setIsNewCustomer(false);

          setHistoryMessage(
            `Application saved. Total loans for this Customer ID: ${loans.length}`
          );
        }
      } catch (historyError) {
        console.warn(
          "History refresh failed after successful save:",
          historyError
        );
      }
    } catch (error) {
      console.error("SAVE ERROR:", error);

      if (
        error instanceof TypeError &&
        error.message === "Failed to fetch"
      ) {
        setMessage(
          "Unable to connect to backend. Please make sure server.js is running on port 5000."
        );
      } else {
        setMessage(
          error.message || "Unable to save application."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     PRINT PAWN TICKET
  ======================================================= */

  const handlePrint = () => {
    setMessage("");

    if (!ticket.declarationAccepted) {
      setMessage(
        "Please accept the declaration before printing the pawn ticket."
      );
      return;
    }

    try {
      const ticketElement =
        document.getElementById("pawn-ticket");

      if (!ticketElement) {
        setMessage("Pawn ticket section not found.");
        return;
      }

      const printWindow = window.open(
        "",
        "_blank",
        "width=1000,height=900,left=50,top=50"
      );

      if (!printWindow) {
        setMessage(
          "Print window was blocked by your browser. Please allow pop-ups for this website and try again."
        );
        return;
      }

      const styles = Array.from(
        document.querySelectorAll(
          'link[rel="stylesheet"], style'
        )
      )
        .map((style) => style.outerHTML)
        .join("\n");

      const ticketClone =
        ticketElement.cloneNode(true);

      const originalInputs =
        ticketElement.querySelectorAll(
          "input, textarea, select"
        );

      const clonedInputs =
        ticketClone.querySelectorAll(
          "input, textarea, select"
        );

      originalInputs.forEach(
        (original, index) => {
          const clone = clonedInputs[index];

          if (!clone) {
            return;
          }

          if (original.tagName === "INPUT") {
            const type = original.type;

            if (type === "checkbox") {
              clone.checked = original.checked;

              if (original.checked) {
                clone.setAttribute(
                  "checked",
                  "checked"
                );
              } else {
                clone.removeAttribute(
                  "checked"
                );
              }
            } else {
              clone.value = original.value;

              clone.setAttribute(
                "value",
                original.value
              );
            }
          }

          if (original.tagName === "TEXTAREA") {
            clone.value = original.value;
            clone.textContent = original.value;
          }

          if (original.tagName === "SELECT") {
            clone.value = original.value;

            Array.from(
              clone.options
            ).forEach((option) => {
              option.removeAttribute("selected");

              if (
                option.value ===
                original.value
              ) {
                option.setAttribute(
                  "selected",
                  "selected"
                );
              }
            });
          }
        }
      );

      ticketClone
        .querySelectorAll(".ticket-actions")
        .forEach((element) => {
          element.remove();
        });

      ticketClone
        .querySelectorAll(".save-message")
        .forEach((element) => {
          element.remove();
        });

      ticketClone
        .querySelectorAll(".customer-loan-history")
        .forEach((element) => {
          element.remove();
        });

      ticketClone
        .querySelectorAll("button")
        .forEach((element) => {
          element.remove();
        });

      printWindow.document.open();

      printWindow.document.write(`
        <!DOCTYPE html>

        <html>

          <head>

            <meta charset="UTF-8" />

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />

            <title>
              Pawn Ticket - ${
                ticket.ticketNumber ||
                savedTicketId ||
                "Mahaveer"
              }
            </title>

            ${styles}

            <style>

              * {
                box-sizing: border-box;
              }

              html,
              body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                width: 100%;
              }

              body {
                font-family: Arial, sans-serif;
                color: #000;
              }

              #pawn-ticket {
                display: block !important;
                visibility: visible !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
              }

              .pawn-ticket-section {
                display: block !important;
                visibility: visible !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
              }

              .pawn-ticket-container {
                display: block !important;
                visibility: visible !important;
                width: 100% !important;
                max-width: none !important;
                margin: 0 auto !important;
                padding: 10px !important;
                background: #ffffff !important;
              }

              .ticket-actions,
              .save-message,
              .customer-loan-history,
              button {
                display: none !important;
              }

              input,
              textarea,
              select {
                color: #000 !important;
                background: transparent !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              textarea {
                resize: none !important;
              }

              img {
                max-width: 100%;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .pawn-ticket-heading,
              .ticket-top-grid,
              .ticket-fields,
              .ticket-bottom-grid,
              .ticket-delivery-note,
              .ticket-declaration,
              .signature-grid {
                break-inside: avoid;
                page-break-inside: avoid;
              }

              @page {
                size: A4;
                margin: 10mm;
              }

              @media print {

                html,
                body {
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #fff !important;
                }

                #pawn-ticket,
                .pawn-ticket-section,
                .pawn-ticket-container {
                  width: 100% !important;
                  margin: 0 !important;
                }

                .ticket-actions,
                .save-message,
                .customer-loan-history,
                button {
                  display: none !important;
                }

              }

            </style>

          </head>

          <body>

            ${ticketClone.outerHTML}

          </body>

        </html>
      `);

      printWindow.document.close();

      const startPrinting = () => {
        try {
          printWindow.focus();

          setTimeout(() => {
            printWindow.focus();
            printWindow.print();

            setTimeout(() => {
              try {
                printWindow.close();
              } catch (closeError) {
                console.warn(
                  "Print window could not be closed:",
                  closeError
                );
              }
            }, 3000);
          }, 700);
        } catch (printError) {
          console.error(
            "PRINT WINDOW ERROR:",
            printError
          );

          setMessage(
            "Unable to open print preview. Please try again."
          );
        }
      };

      const images = printWindow.document.images;

      if (images.length === 0) {
        startPrinting();
        return;
      }

      let remainingImages = images.length;
      let started = false;

      const finishImageLoading = () => {
        remainingImages--;

        if (
          remainingImages <= 0 &&
          !started
        ) {
          started = true;
          startPrinting();
        }
      };

      Array.from(images).forEach((image) => {
        if (image.complete) {
          finishImageLoading();
        } else {
          image.onload = finishImageLoading;
          image.onerror = finishImageLoading;
        }
      });

      setTimeout(() => {
        if (!started) {
          started = true;
          startPrinting();
        }
      }, 3000);
    } catch (error) {
      console.error("PRINT ERROR:", error);

      setMessage(
        "Unable to print the pawn ticket. Please try again."
      );
    }
  };

  /* =======================================================
     FORMAT CURRENCY
  ======================================================= */

  const formatCurrency = (amount) => {
    return `₹${Math.round(
      Number(amount) || 0
    ).toLocaleString("en-IN")}`;
  };

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <section
      className="pawn-ticket-section"
      id="pawn-ticket"
    >
      <div className="pawn-ticket-container">

        {/* =================================================
            PAWN TICKET HEADER
        ================================================= */}

        <div className="pawn-ticket-heading">

          <img
            src="/assets/Left.png"
            alt="Sri Balaji"
            className="ticket-left-image"
          />

          <div className="ticket-heading-content">

            <span>Sri Balaji</span>

            <span>PAWN TICKET</span>

            <h2>MAHAVEER</h2>

            <p>PAWN BROKER</p>
            <span>Estd. 2004</span>

            <p className="pawn-shop-address">
              18-4-126A, Railway Colony Ext.<br />
              TIRUPATI- 517501<br />
              94404 82058
            </p>

          </div>

          <img
            src="/assets/mahaveer-logo.png"
            alt="Mahaveer Logo"
            className="ticket-god-image"
          />

        </div>

        {/* =================================================
            TICKET NUMBER + DATE
        ================================================= */}

        <div className="ticket-top-grid">

          <div className="ticket-field">

            <label htmlFor="ticketNumber">
              P.B. No. / Ticket No.
            </label>

            <input
              id="ticketNumber"
              type="text"
              placeholder="Enter ticket number"
              value={ticket.ticketNumber}
              onChange={(event) =>
                updateTicket(
                  "ticketNumber",
                  event.target.value
                )
              }
            />

          </div>

          <div className="ticket-field">

            <label htmlFor="ticketDate">
              Date
            </label>

            <input
              id="ticketDate"
              type="date"
              value={ticket.ticketDate}
              onChange={(event) =>
                updateTicket(
                  "ticketDate",
                  event.target.value
                )
              }
            />

          </div>

        </div>

        {/* =================================================
            CUSTOMER DETAILS
        ================================================= */}

        <div className="ticket-fields">

          <div className="ticket-field full-width">

            <label htmlFor="customerName">
              Name
            </label>

            <input
              id="customerName"
              type="text"
              placeholder="Enter customer name"
              value={ticket.customerName}
              onChange={(event) =>
                updateTicket(
                  "customerName",
                  event.target.value
                )
              }
            />

          </div>

          <div className="ticket-field full-width">

            <label htmlFor="fatherHusbandName">
              Father's / Husband Name
            </label>

            <input
              id="fatherHusbandName"
              type="text"
              placeholder="Enter father's / husband's name"
              value={ticket.fatherHusbandName}
              onChange={(event) =>
                updateTicket(
                  "fatherHusbandName",
                  event.target.value
                )
              }
            />

          </div>

          <div className="ticket-field full-width">

            <label htmlFor="fullAddress">
              Full Address
            </label>

            <textarea
              id="fullAddress"
              rows="3"
              placeholder="Enter complete address"
              value={ticket.fullAddress}
              onChange={(event) =>
                updateTicket(
                  "fullAddress",
                  event.target.value
                )
              }
            />

          </div>

          <div className="ticket-field">

            <label htmlFor="principalAmount">
              Principal Amount of the Loan
            </label>

            <div className="ticket-input-prefix">

              <span>₹</span>

              <input
                id="principalAmount"
                type="text"
                value={
                  calculatedLoanAmount > 0
                    ? calculatedLoanAmount.toLocaleString(
                        "en-IN"
                      )
                    : ""
                }
                readOnly
              />

            </div>

          </div>

          <div className="ticket-field">

            <label htmlFor="amountInWords">
              In Words Rupees
            </label>

            <input
              id="amountInWords"
              type="text"
              value={
                calculatedLoanAmount > 0
                  ? numberToWords(
                      calculatedLoanAmount
                    )
                  : ""
              }
              readOnly
            />

          </div>

          <div className="ticket-field">

            <label htmlFor="redemptionTime">
              Time Agreed for Redemption
            </label>

            <select
              id="redemptionTime"
              value={ticket.redemptionTime}
              onChange={(event) =>
                updateTicket(
                  "redemptionTime",
                  event.target.value
                )
              }
            >

              <option value="1 Month">
                1 Month
              </option>

              <option value="3 Months">
                3 Months
              </option>

              <option value="6 Months">
                6 Months
              </option>

              <option value="9 Months">
                9 Months
              </option>

              <option value="1 Year">
                1 Year
              </option>

            </select>

          </div>

          {/* =================================================
              CUSTOMER ID
          ================================================= */}

          <div className="ticket-field">

            <label htmlFor="customerId">
              Customer ID
            </label>

            <div
              style={{
                display: "flex",
                gap: "8px",
                width: "100%",
              }}
            >

              <input
                id="customerId"
                type="text"
                placeholder="Enter customer ID"
                value={ticket.customerId}
                onChange={(event) =>
                  updateTicket(
                    "customerId",
                    event.target.value
                  )
                }
                style={{
                  flex: 1,
                }}
              />

              <button
                type="button"
                onClick={searchCustomerHistory}
                disabled={historyLoading}
                style={{
                  padding: "0 16px",
                  cursor: historyLoading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {historyLoading
                  ? "SEARCHING..."
                  : "SEARCH"}
              </button>

            </div>

          </div>

          {/* =================================================
              PARTICULARS
          ================================================= */}

          <div className="ticket-field full-width">

            <label htmlFor="particulars">
              Particulars
            </label>

            <textarea
              id="particulars"
              rows="4"
              placeholder="Enter details of gold ornaments"
              value={ticket.particulars}
              onChange={(event) =>
                updateTicket(
                  "particulars",
                  event.target.value
                )
              }
            />

          </div>

        </div>

        {/* =================================================
            CUSTOMER + JEWELLERY PHOTOS
        ================================================= */}
        <div
          className="ticket-fields"
          style={{
            marginTop: "25px",
            gridTemplateColumns: "1fr 1fr",
          }}
        >
          <div className="ticket-field">
            <label htmlFor="personPhoto">
              Customer Photo
            </label>

            <input
              id="personPhoto"
              type="file"
              accept="image/*"
              onChange={(event) =>
                handleImageChange(
                  "personPhoto",
                  event.target.files?.[0]
                )
              }
            />

            {ticket.personPhoto && (
              <div
                style={{
                  marginTop: "10px",
                  width: "150px",
                  height: "150px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  overflow: "hidden",
                  background: "#f8f8f8",
                }}
              >
                <img
                  src={ticket.personPhoto}
                  alt="Customer preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            )}
          </div>

          <div className="ticket-field">
            <label htmlFor="jewelleryPhoto">
              Jewellery Photo
            </label>

            <input
              id="jewelleryPhoto"
              type="file"
              accept="image/*"
              onChange={(event) =>
                handleImageChange(
                  "jewelleryPhoto",
                  event.target.files?.[0]
                )
              }
            />

            {ticket.jewelleryPhoto && (
              <div
                style={{
                  marginTop: "10px",
                  width: "150px",
                  height: "150px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  overflow: "hidden",
                  background: "#f8f8f8",
                }}
              >
                <img
                  src={ticket.jewelleryPhoto}
                  alt="Jewellery preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* =================================================
            CUSTOMER LOAN HISTORY
        ================================================= */}

        {showHistory && (
          <div
            className="customer-loan-history"
            style={{
              marginTop: "25px",
              padding: "20px",
              border: "1px solid #d4af37",
              borderRadius: "8px",
              background: "#fffdf5",
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >

              <div>

                <h3
                  style={{
                    margin: "0 0 5px",
                  }}
                >
                  Customer Loan History
                </h3>

                <div
                  style={{
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  Customer ID:{" "}
                  <strong>
                    {ticket.customerId}
                  </strong>
                </div>

              </div>

              <div
                style={{
                  textAlign: "right",
                }}
              >

                <div
                  style={{
                    fontSize: "13px",
                    color: "#666",
                  }}
                >
                  Total Loans
                </div>

                <strong
                  style={{
                    fontSize: "28px",
                  }}
                >
                  {customerHistory.length}
                </strong>

              </div>

            </div>

            {/* =================================================
                NEW CUSTOMER
            ================================================= */}

            {isNewCustomer &&
              customerHistory.length === 0 && (
                <div
                  style={{
                    padding: "14px",
                    background: "#e8f5e9",
                    borderRadius: "6px",
                    fontWeight: "600",
                  }}
                >
                  🆕 NEW CUSTOMER

                  <div
                    style={{
                      marginTop: "5px",
                      fontWeight: "400",
                    }}
                  >
                    No previous loan records found.
                    This application can be saved normally.
                  </div>

                </div>
              )}

            {/* =================================================
                HISTORY MESSAGE
            ================================================= */}

            {historyMessage &&
              !isNewCustomer && (
                <div
                  style={{
                    padding: "12px",
                    marginBottom: "12px",
                    background: "#fff3cd",
                    borderRadius: "5px",
                  }}
                >
                  {historyMessage}
                </div>
              )}

            {/* =================================================
                PAYMENT MESSAGE
            ================================================= */}

            {paymentMessage && (
              <div
                style={{
                  padding: "12px",
                  marginBottom: "12px",
                  background:
                    paymentMessage.toLowerCase().includes(
                      "successfully"
                    )
                      ? "#e8f5e9"
                      : "#fdecea",
                  color:
                    paymentMessage.toLowerCase().includes(
                      "successfully"
                    )
                      ? "#176b3a"
                      : "#b42318",
                  borderRadius: "5px",
                  fontWeight: "600",
                }}
              >
                {paymentMessage}
              </div>
            )}

            {/* =================================================
                EXISTING CUSTOMER LOANS
            ================================================= */}

            {customerHistory.length > 0 && (
              <div
                style={{
                  overflowX: "auto",
                }}
              >

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "#fff",
                  }}
                >

                  <thead>

                    <tr>

                      <th style={tableHeaderStyle}>
                        #
                      </th>

                      <th style={tableHeaderStyle}>
                        Date
                      </th>

                      <th style={tableHeaderStyle}>
                        Ticket ID
                      </th>

                      <th
                        style={{
                          ...tableHeaderStyle,
                          textAlign: "right",
                        }}
                      >
                        Loan Amount
                      </th>

                      <th
                        style={{
                          ...tableHeaderStyle,
                          textAlign: "right",
                        }}
                      >
                        Gold Weight
                      </th>

                      <th style={tableHeaderStyle}>
                        Redemption
                      </th>

                      <th style={tableHeaderStyle}>
                        Payment Status
                      </th>

                      <th style={tableHeaderStyle}>
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {customerHistory.map(
                      (loan, index) => {

                        const paymentStatus =
                          String(
                            loan.paymentStatus ||
                              "ACTIVE"
                          ).toUpperCase();

                        const isPaid =
                          paymentStatus === "PAID";

                        const isCurrentlyMarking =
                          markingPaidId ===
                          loan.id;

                        return (
                          <tr
                            key={
                              loan.id ||
                              index
                            }
                          >

                            <td
                              style={
                                tableCellStyle
                              }
                            >
                              {index + 1}
                            </td>

                            <td
                              style={
                                tableCellStyle
                              }
                            >
                              {loan.ticketDate ||
                              loan.createdAt
                                ? new Date(
                                    loan.ticketDate ||
                                      loan.createdAt
                                  ).toLocaleDateString(
                                    "en-IN"
                                  )
                                : "-"}
                            </td>

                            <td
                              style={{
                                ...tableCellStyle,
                                maxWidth: "190px",
                                wordBreak:
                                  "break-word",
                              }}
                            >
                              {loan.id ||
                                loan.ticketNumber ||
                                "-"}
                            </td>

                            <td
                              style={{
                                ...tableCellStyle,
                                textAlign:
                                  "right",
                                fontWeight:
                                  "600",
                              }}
                            >
                              {formatCurrency(
                                loan.loanAmount ||
                                  loan.principalAmount
                              )}
                            </td>

                            <td
                              style={{
                                ...tableCellStyle,
                                textAlign:
                                  "right",
                              }}
                            >
                              {loan.goldWeight ||
                                loan.grossG ||
                                "-"}{" "}
                              {loan.goldWeight ||
                              loan.grossG
                                ? "g"
                                : ""}
                            </td>

                            <td
                              style={
                                tableCellStyle
                              }
                            >
                              {loan.redemptionTime ||
                                "-"}
                            </td>

                            {/* PAYMENT STATUS */}

                            <td
                              style={{
                                ...tableCellStyle,
                                textAlign:
                                  "center",
                              }}
                            >

                              <span
                                style={{
                                  display:
                                    "inline-block",
                                  padding:
                                    "7px 14px",
                                  borderRadius:
                                    "20px",
                                  fontSize:
                                    "12px",
                                  fontWeight:
                                    "700",
                                  background:
                                    isPaid
                                      ? "#d1fae5"
                                      : "#fff0c2",
                                  color:
                                    isPaid
                                      ? "#047857"
                                      : "#946200",
                                }}
                              >
                                {isPaid
                                  ? "PAID"
                                  : "ACTIVE"}
                              </span>

                              {isPaid &&
                                loan.paidAt && (
                                  <div
                                    style={{
                                      fontSize:
                                        "11px",
                                      marginTop:
                                        "5px",
                                      color:
                                        "#666",
                                    }}
                                  >
                                    {new Date(
                                      loan.paidAt
                                    ).toLocaleDateString(
                                      "en-IN"
                                    )}
                                  </div>
                                )}

                            </td>

                            {/* ACTION */}

                            <td
                              style={{
                                ...tableCellStyle,
                                textAlign:
                                  "center",
                              }}
                            >

                              {isPaid ? (
                                <span
                                  style={{
                                    color:
                                      "#047857",
                                    fontWeight:
                                      "700",
                                    fontSize:
                                      "13px",
                                  }}
                                >
                                  ✓ LOAN PAID
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    markLoanAsPaid(
                                      loan
                                    )
                                  }
                                  disabled={
                                    isCurrentlyMarking
                                  }
                                  style={{
                                    border:
                                      "none",
                                    borderRadius:
                                      "6px",
                                    padding:
                                      "10px 14px",
                                    background:
                                      isCurrentlyMarking
                                        ? "#999"
                                        : "#198754",
                                    color:
                                      "#fff",
                                    fontWeight:
                                      "700",
                                    cursor:
                                      isCurrentlyMarking
                                        ? "not-allowed"
                                        : "pointer",
                                  }}
                                >
                                  {isCurrentlyMarking
                                    ? "UPDATING..."
                                    : "MARK AS PAID"}
                                </button>
                              )}

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>
        )}

        {/* =================================================
            ANNUAL INCOME + GOLD WEIGHT
        ================================================= */}

        <div className="ticket-bottom-grid">

          <div className="income-box">

            <h3>
              My Annual Income
            </h3>

            <div className="ticket-input-prefix">

              <span>₹</span>

              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter annual income"
                value={ticket.annualIncome}
                onChange={(event) =>
                  updateTicket(
                    "annualIncome",
                    event.target.value
                  )
                }
              />

            </div>

          </div>

          <div className="weight-section">

            <h3>
              Gold Weight
            </h3>

            <div className="weight-table">

              <div className="weight-header">

                <span></span>

                <span>Kg.</span>

                <span>G.</span>

                <span>M.G.</span>

                <span>P.V.</span>

              </div>

              <div className="weight-row">

                <strong>
                  Gross Wt.
                </strong>

                <input
                  type="text"
                  value={ticket.grossKg}
                  onChange={(event) =>
                    updateTicket(
                      "grossKg",
                      event.target.value
                    )
                  }
                />

                <input
                  type="text"
                  value={calculatorGoldWeight}
                  readOnly
                />

                <input
                  type="text"
                  value={ticket.grossMg}
                  onChange={(event) =>
                    updateTicket(
                      "grossMg",
                      event.target.value
                    )
                  }
                />

                <input
                  type="text"
                  value={ticket.grossPv}
                  onChange={(event) =>
                    updateTicket(
                      "grossPv",
                      event.target.value
                    )
                  }
                />

              </div>

              <div className="weight-row">

                <strong>
                  Nett Wt.
                </strong>

                <input
                  type="text"
                  value={ticket.netKg}
                  onChange={(event) =>
                    updateTicket(
                      "netKg",
                      event.target.value
                    )
                  }
                />

                <input
                  type="text"
                  value={ticket.netG}
                  onChange={(event) =>
                    updateTicket(
                      "netG",
                      event.target.value
                    )
                  }
                />

                <input
                  type="text"
                  value={ticket.netMg}
                  onChange={(event) =>
                    updateTicket(
                      "netMg",
                      event.target.value
                    )
                  }
                />

                <input
                  type="text"
                  value={ticket.netPv}
                  onChange={(event) =>
                    updateTicket(
                      "netPv",
                      event.target.value
                    )
                  }
                />

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            DELIVERY
        ================================================= */}

        <div className="ticket-delivery-note">
          The article will be delivered after three
          days of payment.
        </div>

        {/* =================================================
            DECLARATION
        ================================================= */}

        <div className="ticket-declaration">

          <label className="declaration-checkbox">

            <input
              type="checkbox"
              checked={
                ticket.declarationAccepted
              }
              onChange={(event) =>
                updateTicket(
                  "declarationAccepted",
                  event.target.checked
                )
              }
            />

            <span>
              I declare that the above mentioned
              gold ornaments are my own and the
              information provided by me is correct.
            </span>

          </label>

        </div>

        {/* =================================================
            SIGNATURES
        ================================================= */}

        <div className="signature-grid">

          <div className="signature-box">

            <div className="signature-space"></div>

            <strong>
              Signature / Left Thumb Impression
            </strong>

            <span>
              of the Pawner
            </span>

          </div>

          <div className="signature-box">

            <div className="signature-space"></div>

            <strong>
              Signature of the Pawn Broker
            </strong>

            <span>
              or his Agent
            </span>

          </div>

        </div>

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div className="save-message">
            {message}
          </div>
        )}

        {/* =================================================
            BUTTONS
        ================================================= */}

        <div className="ticket-actions">

          <button
            type="button"
            className="save-button"
            onClick={handleSave}
            disabled={
              saving ||
              !ticket.declarationAccepted
            }
          >
            {saving
              ? "SAVING..."
              : "SAVE APPLICATION"}
          </button>

          <button
            type="button"
            className="print-button"
            onClick={handlePrint}
            disabled={
              !ticket.declarationAccepted
            }
          >
            🖨 PRINT PAWN TICKET
          </button>

        </div>

      </div>
    </section>
  );
}

/* =========================================================
   TABLE STYLES
========================================================= */

const tableHeaderStyle = {
  padding: "10px",
  border: "1px solid #ddd",
  textAlign: "left",
  background: "#f8f8f8",
};

const tableCellStyle = {
  padding: "10px",
  border: "1px solid #ddd",
};

/* =========================================================
   EXPORT
========================================================= */

export default PawnTicketForm;