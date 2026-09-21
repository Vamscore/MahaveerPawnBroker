import { useEffect, useState } from "react";

const API_URL =
  "https://mahaveer-pawn-broker-c32n.vercel.app/api/pawn-tickets";
      // "http://localhost:5000/api/pawn-tickets";

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
  phoneNumber: "",

  principalAmount: "",
  amountInWords: "",

  redemptionTime: "1 Year",

  particulars: "",
  aadharCardNumber: "",
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
     KEEP CALCULATOR VALUES IN SYNC WITH PAWN TICKET
     Values are auto-filled from the calculator, but remain editable.
  ======================================================= */

  useEffect(() => {
    setTicket((current) => ({
      ...current,
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
  }, [calculatorGoldWeight, calculatedLoanAmount]);

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
     CUSTOMER HISTORY SEARCH
     The Aadhar Card section can search by:
     1. Aadhar Card Number
     2. Phone Number
     3. Customer Name
  ======================================================= */

  const [customerSearchValue, setCustomerSearchValue] = useState("");

  const [customerSearchType, setCustomerSearchType] = useState("");

  /* =======================================================
     UPDATE TICKET
  ======================================================= */

  const updateTicket = (field, value) => {
    setTicket((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === "aadharCardNumber") {
      const aadharCardNumber = value.trim();

      setCustomerSearchValue(value);
      setCustomerSearchType("");
      setCustomerHistory([]);
      setHistoryMessage("");
      setPaymentMessage("");
      setShowHistory(false);
      setIsNewCustomer(false);

      if (!aadharCardNumber) {
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
     Search by:
     1. Aadhar Card Number
     2. Phone Number
     3. Customer Name
     4. Ticket Number (example: C1001)
  ======================================================= */

  const searchCustomerHistory = async () => {
    const searchValue = customerSearchValue.trim();

    if (!searchValue) {
      setHistoryMessage(
        "Please enter Aadhar Card Number, Phone Number, Customer Name, or Ticket Number first."
      );

      setCustomerHistory([]);
      setShowHistory(true);
      setIsNewCustomer(false);
      setCustomerSearchType("");

      return;
    }

    setHistoryLoading(true);
    setHistoryMessage("");
    setPaymentMessage("");
    setCustomerHistory([]);
    setShowHistory(false);
    setIsNewCustomer(false);

    try {
      const normalizedSearchValue = searchValue.toLowerCase();

      /*
       * Ticket numbers are normally entered in the form C1001.
       * Search the main pawn-ticket collection and match either
       * ticketNumber or id. This keeps ticket-number searching
       * inside this form without changing the existing customer
       * search behaviour.
       */
      const looksLikeTicketNumber =
        /^c\d+$/i.test(searchValue);

      let result = {};
      let loans = [];

      if (looksLikeTicketNumber) {
        const ticketResponse = await fetch(API_URL);

        let ticketResult = {};

        try {
          ticketResult = await ticketResponse.json();
        } catch (jsonError) {
          console.warn(
            "Ticket search response was not JSON:",
            jsonError
          );
        }

        if (!ticketResponse.ok) {
          throw new Error(
            ticketResult.message ||
              "Unable to search ticket number."
          );
        }

        const allTickets = Array.isArray(ticketResult)
          ? ticketResult
          : Array.isArray(ticketResult.tickets)
          ? ticketResult.tickets
          : Array.isArray(ticketResult.data)
          ? ticketResult.data
          : ticketResult.ticket
          ? [ticketResult.ticket]
          : [];

        loans = allTickets.filter((loan) => {
          const ticketNumber = String(
            loan?.ticketNumber || ""
          ).trim().toLowerCase();

          const ticketId = String(
            loan?.id || ""
          ).trim().toLowerCase();

          return (
            ticketNumber === normalizedSearchValue ||
            ticketId === normalizedSearchValue
          );
        });

        result = {
          tickets: loans,
          isNewCustomer: loans.length === 0,
        };

        setCustomerSearchType("Ticket Number");
      } else {
        const response = await fetch(
          `${API_URL}/customer/${encodeURIComponent(
            searchValue
          )}`
        );

        try {
          result = await response.json();
        } catch (jsonError) {
          console.warn(
            "Customer search response was not JSON:",
            jsonError
          );
        }

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to find customer history."
          );
        }

        loans = Array.isArray(result.tickets)
          ? result.tickets
          : [];
      }

      setCustomerHistory(loans);
      setShowHistory(true);

      /* ---------------------------------------------------
         DETECT WHAT THE USER SEARCHED FOR
      --------------------------------------------------- */

      if (!looksLikeTicketNumber) {
        const digitsOnly = searchValue.replace(/\D/g, "");

        let detectedType = "Customer Name";

        if (
          digitsOnly.length === 12 &&
          digitsOnly === searchValue.replace(/\D/g, "")
        ) {
          detectedType = "Aadhar Card Number";
        } else if (digitsOnly.length === 10) {
          detectedType = "Phone Number";
        }

        setCustomerSearchType(detectedType);
      }

      const detectedType = looksLikeTicketNumber
        ? "Ticket Number"
        : customerSearchType ||
          (() => {
            const digitsOnly = searchValue.replace(/\D/g, "");

            if (
              digitsOnly.length === 12 &&
              digitsOnly === searchValue.replace(/\D/g, "")
            ) {
              return "Aadhar Card Number";
            }

            if (digitsOnly.length === 10) {
              return "Phone Number";
            }

            return "Customer Name";
          })();

      if (result.isNewCustomer || loans.length === 0) {
        setIsNewCustomer(true);

        setHistoryMessage(
          `No previous loan found for this ${detectedType.toLowerCase()}.`
        );
      } else {
        setIsNewCustomer(false);

        /* -------------------------------------------------
           EXISTING CUSTOMER / TICKET DETAILS

           For Aadhar, phone, customer name, OR ticket number,
           use the first matching loan to fill the customer
           details in the current pawn ticket.
        ------------------------------------------------- */

        const matchedLoan = loans[0] || {};

        const matchedCustomerId = String(
          matchedLoan.customerId ||
            matchedLoan.aadharCardNumber ||
            ""
        ).trim();

        const matchedCustomerName = String(
          matchedLoan.customerName ||
            matchedLoan.name ||
            ""
        ).trim();

        const matchedFatherHusbandName = String(
          matchedLoan.fatherHusbandName ||
            matchedLoan.fatherName ||
            matchedLoan.husbandName ||
            ""
        ).trim();

        const matchedPhoneNumber = String(
          matchedLoan.phoneNumber ||
            matchedLoan.mobileNumber ||
            matchedLoan.mobile ||
            matchedLoan.phone ||
            ""
        )
          .replace(/\D/g, "")
          .trim();

        const matchedAddress = String(
          matchedLoan.fullAddress ||
            matchedLoan.address ||
            ""
        ).trim();

        const matchedAadhar = String(
          matchedLoan.aadharCardNumber ||
            matchedLoan.aadharNumber ||
            matchedLoan.customerId ||
            ""
        ).trim();

        const matchedTicketNumber = String(
          matchedLoan.ticketNumber || ""
        ).trim();

        setTicket((current) => ({
          ...current,

          ticketNumber:
            matchedTicketNumber ||
            current.ticketNumber,

          customerName:
            matchedCustomerName ||
            current.customerName,

          fatherHusbandName:
            matchedFatherHusbandName ||
            current.fatherHusbandName,

          phoneNumber:
            matchedPhoneNumber ||
            current.phoneNumber,

          fullAddress:
            matchedAddress ||
            current.fullAddress,

          aadharCardNumber:
            matchedAadhar ||
            matchedCustomerId ||
            current.aadharCardNumber,
        }));

        setHistoryMessage(
          looksLikeTicketNumber
            ? `Ticket ${matchedTicketNumber || searchValue} found successfully.`
            : `Existing customer: ${
                matchedCustomerName || searchValue
              }. ${loans.length} previous loan${
                loans.length === 1 ? "" : "s"
              } found using ${detectedType}.`
        );
      }
    } catch (error) {
      console.error(
        "CUSTOMER/TICKET SEARCH ERROR:",
        error
      );

      setCustomerHistory([]);
      setShowHistory(true);
      setIsNewCustomer(false);
      setCustomerSearchType("");

      setHistoryMessage(
        error.message ||
          "Search could not be completed. Please try again."
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
      setPaymentMessage(
        "Unable to identify this loan."
      );

      return;
    }

    const currentStatus = String(
      loan.paymentStatus || "ACTIVE"
    ).toUpperCase();

    if (currentStatus === "PAID") {
      setPaymentMessage(
        "This loan is already marked as paid."
      );

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
        `${API_URL}/${encodeURIComponent(
          loan.id
        )}/paid`,
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
        console.warn(
          "Payment response was not JSON:",
          jsonError
        );
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to mark loan as paid."
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
      console.error(
        "MARK LOAN AS PAID ERROR:",
        error
      );

      setPaymentMessage(
        error.message ||
          "Unable to mark loan as paid."
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

    const editablePrincipalAmount =
      Number(
        String(
          ticket.principalAmount || ""
        ).replace(/,/g, "")
      ) || 0;

    if (editablePrincipalAmount <= 0) {
      setMessage(
        "Please enter a valid Principal Amount."
      );

      return;
    }

    if (!String(ticket.grossG || "").trim()) {
      setMessage(
        "Please enter a valid Gold Weight in G."
      );

      return;
    }

    setSaving(true);

    /* =====================================================
       COMPLETE APPLICATION

       PHONE NUMBER:
       Explicitly sends phoneNumber to backend.

       LOAN MONTH:
       Explicitly sends the selected redemptionTime
       as loanMonth to backend.
    ===================================================== */

    const completeApplication = {
      ...loanData,
      ...ticket,

      aadharCardNumber:
        ticket.aadharCardNumber.trim(),

      customerId:
        ticket.aadharCardNumber.trim() || "",

      /* ===================================================
         PHONE NUMBER
      =================================================== */

      phoneNumber: String(
        ticket.phoneNumber ||
          ticket.mobileNumber ||
          ticket.mobile ||
          ticket.phone ||
          ""
      )
        .replace(/\D/g, "")
        .trim(),

      /* ===================================================
         LOAN MONTH
         Backend saves this in AE column.
      =================================================== */

      loanMonth: String(
        ticket.loanMonth ||
          ticket.redemptionTime ||
          ticket.month ||
          ""
      ).trim(),

      goldWeight:
        ticket.grossG,

      grossG:
        ticket.grossG,

      principalAmount:
        editablePrincipalAmount,

      loanAmount:
        editablePrincipalAmount,

      amountInWords:
        ticket.amountInWords ||
        numberToWords(
          editablePrincipalAmount
        ),

      declarationAccepted:
        true,

      paymentStatus:
        "ACTIVE",

      paidAt:
        null,

      createdAt:
        new Date().toISOString(),
    };

    try {
      const response = await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            completeApplication
          ),
        }
      );

      let result = {};

      try {
        result =
          await response.json();
      } catch (jsonError) {
        console.warn(
          "Save response was not JSON:",
          jsonError
        );
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to save application."
        );
      }

      const newTicketId =
        result.id ||
        result.ticket?.id ||
        "";

      setSavedTicketId(
        newTicketId
      );

      if (
        newTicketId &&
        !ticket.ticketNumber.trim()
      ) {
        setTicket(
          (current) => ({
            ...current,
            ticketNumber:
              newTicketId,
          })
        );
      }

      setMessage(
        `Application saved successfully. Ticket ID: ${
          newTicketId || "-"
        }`
      );

      /* ===================================================
         REFRESH CUSTOMER HISTORY
      =================================================== */

      if (ticket.aadharCardNumber.trim()) {
        try {
          const aadharCardNumber =
            ticket.aadharCardNumber.trim();

          const historyResponse =
            await fetch(
              `${API_URL}/customer/${encodeURIComponent(
                aadharCardNumber
              )}`
            );

          if (
            historyResponse.ok
          ) {
            const historyResult =
              await historyResponse.json();

            const loans =
              Array.isArray(
                historyResult.tickets
              )
                ? historyResult.tickets
                : [];

            setCustomerHistory(
              loans
            );

            setShowHistory(
              true
            );

            setIsNewCustomer(
              false
            );

            setHistoryMessage(
              `Application saved. Total loans for this Aadhar Card Number: ${loans.length}`
            );
          }
        } catch (
          historyError
        ) {
          console.warn(
            "History refresh failed after successful save:",
            historyError
          );
        }
      }
    } catch (error) {
      console.error(
        "SAVE ERROR:",
        error
      );

      if (
        error instanceof
          TypeError &&
        error.message ===
          "Failed to fetch"
      ) {
        setMessage(
          "Unable to connect to backend. Please make sure server.js is running on port 5000."
        );
      } else {
        setMessage(
          error.message ||
            "Unable to save application."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
   PRINT PAWN TICKET
======================================================= */
/* =======================================================
   PRINT PAWN TICKET
======================================================= */

const handlePrint = () => {
  setMessage("");

  // 1. Check declaration
  if (!ticket.declarationAccepted) {
    setMessage(
      "Please accept the declaration before printing the pawn ticket."
    );
    return;
  }

  // 2. Find pawn ticket
  const ticketElement = document.getElementById("pawn-ticket");

  if (!ticketElement) {
    setMessage("Pawn ticket section not found.");
    return;
  }

  try {
    // 3. Add print mode
    document.body.classList.add("printing-pawn-ticket");
    ticketElement.classList.add("print-this-ticket");

    // 4. Function to restore normal page
    const cleanupPrint = () => {
      document.body.classList.remove("printing-pawn-ticket");
      ticketElement.classList.remove("print-this-ticket");

      window.removeEventListener(
        "afterprint",
        cleanupPrint
      );
    };

    // 5. Restore page after Chrome print dialog closes
    window.addEventListener(
      "afterprint",
      cleanupPrint
    );

    // 6. Open Chrome's normal print dialog
    setTimeout(() => {
      window.print();
    }, 100);

  } catch (error) {
    console.error("PRINT ERROR:", error);

    document.body.classList.remove(
      "printing-pawn-ticket"
    );

    ticketElement.classList.remove(
      "print-this-ticket"
    );

    setMessage(
      "Unable to print the pawn ticket. Please try again."
    );
  }
};  

  /* =======================================================
     FORMAT CURRENCY
  ======================================================= */

  const formatCurrency = (
    amount
  ) => {
    return `₹${Math.round(
      Number(amount) || 0
    ).toLocaleString(
      "en-IN"
    )}`;
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
            MOBILE PAWN TICKET HEADER FIX
            Keeps both logos inside the ticket on iPhone/Android.
            Desktop layout is unchanged.
        ================================================= */}

        <style>{`
          @media (max-width: 768px) {
            .pawn-ticket-container {
              width: 100% !important;
              max-width: 100% !important;
              overflow-x: hidden !important;
              box-sizing: border-box !important;
            }

            .pawn-ticket-heading {
              width: 100% !important;
              max-width: 100% !important;
              display: grid !important;
              grid-template-columns: clamp(58px, 18vw, 78px) minmax(0, 1fr) clamp(58px, 18vw, 78px) !important;
              align-items: center !important;
              justify-items: center !important;
              gap: 4px !important;
              overflow: hidden !important;
              box-sizing: border-box !important;
            }

            .pawn-ticket-heading .ticket-left-image,
            .pawn-ticket-heading .ticket-god-image {
              width: 100% !important;
              max-width: 78px !important;
              height: auto !important;
              max-height: 78px !important;
              object-fit: contain !important;
              display: block !important;
              margin: 0 !important;
            }

            .pawn-ticket-heading .ticket-heading-content {
              width: 100% !important;
              min-width: 0 !important;
              max-width: 100% !important;
              overflow: hidden !important;
              box-sizing: border-box !important;
              text-align: center !important;
            }

            .pawn-ticket-heading .ticket-heading-content h2 {
              max-width: 100% !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
              font-size: clamp(24px, 7vw, 34px) !important;
              line-height: 1.05 !important;
              white-space: nowrap !important;
            }

            .pawn-ticket-heading .pawn-shop-address {
              font-size: clamp(11px, 3.2vw, 15px) !important;
              line-height: 1.25 !important;
              overflow-wrap: anywhere !important;
            }
          }

          @media (max-width: 360px) {
            .pawn-ticket-heading {
              grid-template-columns: 54px minmax(0, 1fr) 54px !important;
              gap: 2px !important;
            }

            .pawn-ticket-heading .ticket-left-image,
            .pawn-ticket-heading .ticket-god-image {
              max-width: 54px !important;
              max-height: 54px !important;
            }

            .pawn-ticket-heading .ticket-heading-content h2 {
              font-size: 22px !important;
            }

            .pawn-ticket-heading .pawn-shop-address {
              font-size: 10px !important;
            }
          }
        `}</style>

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

            <span>
              Sri Balaji
            </span>

            <span>
              PAWN TICKET
            </span>

            <h2>
              MAHAVEER
            </h2>

            <p>
              PAWN BROKER
            </p>

            <span>
              Estd. 2004
            </span>

            <p className="pawn-shop-address">
              18-4-126A, Railway Colony Ext.<br />
              TIRUPATI- 517501<br />
              Sri Dadhimataji Namaha<br />
              P.B.L. NO. 705/TPT(U)/04<br />
              94404 82058
            </p>

          </div>

          <img
            src="/assets/mahaveer-logo.png"
            alt="Mahaveer Logo"
            className="ticket-god-image"
            style={{
              maxWidth: "100%",
              height: "auto",
              objectFit: "contain",
              display: "block",
            }}
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
              value={
                ticket.ticketNumber
              }
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
              value={
                ticket.ticketDate
              }
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
              value={
                ticket.customerName
              }
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
              value={
                ticket.fatherHusbandName
              }
              onChange={(event) =>
                updateTicket(
                  "fatherHusbandName",
                  event.target.value
                )
              }
            />

          </div>

          <div className="ticket-field">

            <label htmlFor="phoneNumber">
              Phone Number
            </label>

            <input
              id="phoneNumber"
              type="tel"
              inputMode="numeric"
              placeholder="Enter phone number"
              value={
                ticket.phoneNumber
              }
              onChange={(event) =>
                updateTicket(
                  "phoneNumber",
                  event.target.value
                )
              }
            />

          </div>

          <div className="ticket-field">

            <label htmlFor="aadharCardNumberInput">
              Aadhar Card Number
            </label>

            <input
              id="aadharCardNumberInput"
              type="text"
              inputMode="numeric"
              placeholder="Enter Aadhar Card Number"
              value={
                ticket.aadharCardNumber
              }
              onChange={(event) =>
                updateTicket(
                  "aadharCardNumber",
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
              value={
                ticket.fullAddress
              }
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

              <span>
                ₹
              </span>

              <input
                id="principalAmount"
                type="text"
                value={
                  ticket.principalAmount
                }
                onChange={(event) => {
                  const value =
                    event.target.value;

                  updateTicket(
                    "principalAmount",
                    value
                  );

                  const numericValue =
                    Number(
                      value.replace(
                        /,/g,
                        ""
                      )
                    );

                  updateTicket(
                    "amountInWords",
                    value.trim() &&
                      numericValue >
                        0
                      ? numberToWords(
                          numericValue
                        )
                      : ""
                  );
                }}
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
                ticket.amountInWords
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
              value={
                ticket.redemptionTime
              }
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

            <label htmlFor="aadharCardNumber">
              Phone / Customer Name / P.B. No. / Aadhar
            </label>

            <div
              style={{
                display:
                  "flex",
                gap:
                  "8px",
                width:
                  "100%",
              }}
            >

              <input
                id="aadharCardNumber"
                type="text"
                placeholder="Enter Aadhar, Phone, Customer Name or Ticket No. (e.g. C1001)"
                value={
                  customerSearchValue
                }
                onChange={(event) => {
                  const value = event.target.value;

                  setCustomerSearchValue(value);
                  setCustomerSearchType("");

                  setCustomerHistory([]);
                  setHistoryMessage("");
                  setPaymentMessage("");
                  setShowHistory(false);
                  setIsNewCustomer(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    searchCustomerHistory();
                  }
                }}
                style={{
                  flex: 1,
                }}
              />

              <button
                type="button"
                onClick={
                  searchCustomerHistory
                }
                disabled={
                  historyLoading
                }
                style={{
                  padding:
                    "0 16px",
                  cursor:
                    historyLoading
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {
                  historyLoading
                    ? "SEARCHING..."
                    : "SEARCH"
                }
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
              value={
                ticket.particulars
              }
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
            marginTop:
              "25px",
            gridTemplateColumns:
              "1fr 1fr",
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
                  marginTop:
                    "10px",
                  width:
                    "150px",
                  height:
                    "150px",
                  border:
                    "1px solid #ddd",
                  borderRadius:
                    "6px",
                  overflow:
                    "hidden",
                  background:
                    "#f8f8f8",
                }}
              >

                <img
                  src={
                    ticket.personPhoto
                  }
                  alt="Customer preview"
                  style={{
                    width:
                      "100%",
                    height:
                      "100%",
                    objectFit:
                      "cover",
                    display:
                      "block",
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
                  marginTop:
                    "10px",
                  width:
                    "150px",
                  height:
                    "150px",
                  border:
                    "1px solid #ddd",
                  borderRadius:
                    "6px",
                  overflow:
                    "hidden",
                  background:
                    "#f8f8f8",
                }}
              >

                <img
                  src={
                    ticket.jewelleryPhoto
                  }
                  alt="Jewellery preview"
                  style={{
                    width:
                      "100%",
                    height:
                      "100%",
                    objectFit:
                      "cover",
                    display:
                      "block",
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
              marginTop:
                "25px",
              padding:
                "20px",
              border:
                "1px solid #d4af37",
              borderRadius:
                "8px",
              background:
                "#fffdf5",
            }}
          >

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "15px",
              }}
            >

              <div>

                <h3
                  style={{
                    margin:
                      "0 0 5px",
                  }}
                >
                  Customer Loan History
                </h3>

                <div
                  style={{
                    fontSize:
                      "14px",
                    color:
                      "#666",
                  }}
                >
                  Search:{" "}
                  <strong>
                    {customerSearchValue || ticket.aadharCardNumber}
                  </strong>
                  {customerSearchType && (
                    <span style={{ marginLeft: "8px" }}>
                      ({customerSearchType})
                    </span>
                  )}
                </div>

              </div>

              <div
                style={{
                  textAlign:
                    "right",
                }}
              >

                <div
                  style={{
                    fontSize:
                      "13px",
                    color:
                      "#666",
                  }}
                >
                  Total Loans
                </div>

                <strong
                  style={{
                    fontSize:
                      "28px",
                  }}
                >
                  {
                    customerHistory.length
                  }
                </strong>

              </div>

            </div>

            {/* =================================================
                NEW CUSTOMER
            ================================================= */}

            {isNewCustomer &&
              customerHistory.length ===
                0 && (
                <div
                  style={{
                    padding:
                      "14px",
                    background:
                      "#e8f5e9",
                    borderRadius:
                      "6px",
                    fontWeight:
                      "600",
                  }}
                >

                  🆕 NEW CUSTOMER

                  <div
                    style={{
                      marginTop:
                        "5px",
                      fontWeight:
                        "400",
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
                    padding:
                      "12px",
                    marginBottom:
                      "12px",
                    background:
                      "#fff3cd",
                    borderRadius:
                      "5px",
                  }}
                >
                  {
                    historyMessage
                  }
                </div>
              )}

            {/* =================================================
                PAYMENT MESSAGE
            ================================================= */}

            {paymentMessage && (
              <div
                style={{
                  padding:
                    "12px",
                  marginBottom:
                    "12px",
                  background:
                    paymentMessage
                      .toLowerCase()
                      .includes(
                        "successfully"
                      )
                      ? "#e8f5e9"
                      : "#fdecea",
                  color:
                    paymentMessage
                      .toLowerCase()
                      .includes(
                        "successfully"
                      )
                      ? "#176b3a"
                      : "#b42318",
                  borderRadius:
                    "5px",
                  fontWeight:
                    "600",
                }}
              >
                {
                  paymentMessage
                }
              </div>
            )}

            {/* =================================================
                EXISTING CUSTOMER LOANS
            ================================================= */}

            {customerHistory.length >
              0 && (
              <div
                style={{
                  overflowX:
                    "auto",
                }}
              >

                <table
                  style={{
                    width:
                      "100%",
                    borderCollapse:
                      "collapse",
                    background:
                      "#fff",
                  }}
                >

                  <thead>

                    <tr>

                      <th
                        style={
                          tableHeaderStyle
                        }
                      >
                        #
                      </th>

                      <th
                        style={
                          tableHeaderStyle
                        }
                      >
                        Date
                      </th>

                      <th
                        style={
                          tableHeaderStyle
                        }
                      >
                        Customer Name
                      </th>

                      <th
                        style={
                          tableHeaderStyle
                        }
                      >
                        P.B. No. / Ticket No.
                      </th>

                      <th
                        style={{
                          ...tableHeaderStyle,
                          textAlign:
                            "right",
                        }}
                      >
                        Loan Amount
                      </th>

                      <th
                        style={{
                          ...tableHeaderStyle,
                          textAlign:
                            "right",
                        }}
                      >
                        Gold Weight
                      </th>

                      <th
                        style={
                          tableHeaderStyle
                        }
                      >
                        Redemption
                      </th>

                      <th
                        style={
                          tableHeaderStyle
                        }
                      >
                        Payment Status
                      </th>

                      <th
                        style={
                          tableHeaderStyle
                        }
                      >
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {customerHistory.map(
                      (
                        loan,
                        index
                      ) => {

                        const paymentStatus =
                          String(
                            loan.paymentStatus ||
                              "ACTIVE"
                          ).toUpperCase();

                        const isPaid =
                          paymentStatus ===
                          "PAID";

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
                              {
                                index +
                                1
                              }
                            </td>

                            <td
                              style={
                                tableCellStyle
                              }
                            >
                              {
                                loan.ticketDate ||
                                loan.createdAt
                                  ? new Date(
                                      loan.ticketDate ||
                                        loan.createdAt
                                    ).toLocaleDateString(
                                      "en-IN"
                                    )
                                  : "-"
                              }
                            </td>

                            <td
                              style={{
                                ...tableCellStyle,
                                maxWidth:
                                  "190px",
                                wordBreak:
                                  "break-word",
                              }}
                            >
                              {
                                loan.customerName ||
                                "-"
                              }
                            </td>

                            <td
                              style={{
                                ...tableCellStyle,
                                maxWidth:
                                  "190px",
                                wordBreak:
                                  "break-word",
                                fontWeight:
                                  "600",
                              }}
                            >
                              {
                                loan.ticketNumber ||
                                "-"
                              }
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
                              {
                                formatCurrency(
                                  loan.loanAmount ||
                                    loan.principalAmount
                                )
                              }
                            </td>

                            <td
                              style={{
                                ...tableCellStyle,
                                textAlign:
                                  "right",
                              }}
                            >
                              {
                                loan.goldWeight ||
                                loan.grossG ||
                                "-"
                              }{" "}
                              {
                                loan.goldWeight ||
                                loan.grossG
                                  ? "g"
                                  : ""
                              }
                            </td>

                            <td
                              style={
                                tableCellStyle
                              }
                            >
                              {
                                loan.redemptionTime ||
                                "-"
                              }
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
                                {
                                  isPaid
                                    ? "PAID"
                                    : "ACTIVE"
                                }
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
                                    {
                                      new Date(
                                        loan.paidAt
                                      ).toLocaleDateString(
                                        "en-IN"
                                      )
                                    }
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
                                  {
                                    isCurrentlyMarking
                                      ? "UPDATING..."
                                      : "MARK AS PAID"
                                  }
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
              Annual Income
            </h3>

            <div className="ticket-input-prefix">

              <span>
                ₹
              </span>

              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter annual income"
                value={
                  ticket.annualIncome
                }
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

                <span>
                  Kg.
                </span>

                <span>
                  G.
                </span>

                <span>
                  M.G.
                </span>

                <span>
                  P.V.
                </span>

              </div>

              <div className="weight-row">

                <strong>
                  Gross Wt.
                </strong>

                <input
                  type="text"
                  value={
                    ticket.grossKg
                  }
                  onChange={(event) =>
                    updateTicket(
                      "grossKg",
                      event.target.value
                    )
                  }
                />

                <input
                  type="text"
                  value={
                    ticket.grossG
                  }
                  onChange={(event) =>
                    updateTicket(
                      "grossG",
                      event.target.value
                    )
                  }
                />

                <input
                  type="text"
                  value={
                    ticket.grossMg
                  }
                  onChange={(event) =>
                    updateTicket(
                      "grossMg",
                      event.target.value
                    )
                  }
                />

                <input
                  type="text"
                  value={
                    ticket.grossPv
                  }
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
                  value={
                    ticket.netKg
                  }
                  onChange={(event) =>
                    updateTicket(
                      "netKg",
                      event.target.value
                    )
                  }
                />

                <input
                  type="text"
                  value={
                    ticket.netG
                  }
                  onChange={(event) =>
                    updateTicket(
                      "netG",
                      event.target.value
                    )
                  }
                />

                <input
                  type="text"
                  value={
                    ticket.netMg
                  }
                  onChange={(event) =>
                    updateTicket(
                      "netMg",
                      event.target.value
                    )
                  }
                />

                <input
                  type="text"
                  value={
                    ticket.netPv
                  }
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
            onClick={
              handleSave
            }
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
            onClick={
              handlePrint
            }
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