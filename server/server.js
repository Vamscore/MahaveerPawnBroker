import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const app = express();
const PORT = 5000;

/* =========================================================
   GOOGLE SHEETS CONFIGURATION
========================================================= */

const GOOGLE_CLIENT_EMAIL =
  process.env.GOOGLE_CLIENT_EMAIL;

const GOOGLE_PRIVATE_KEY =
  process.env.GOOGLE_PRIVATE_KEY
    ?.replace(/^"|"$/g, "")
    .replace(/\\n/g, "\n");

const GOOGLE_SHEET_ID =
  process.env.GOOGLE_SHEET_ID;

/* =========================================================
   OWNER NUMBERS
========================================================= */

const OWNER_NUMBERS = [
  "9440482058",
  "8106982058",
  "6366305115",
];

/* =========================================================
   OWNER PINS
   EACH MOBILE HAS ITS OWN PIN
   PIN MUST CONTAIN:
   - ALPHABET
   - NUMBER
   - SPECIAL CHARACTER
========================================================= */

const OWNER_PINS = {
  "9440482058": "Mahaveer@123",
  "8106982058": "Gold#456",
  "6366305115": "Pawn$789",
};

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "5mb",
  })
);

/* =========================================================
   GOOGLE AUTHENTICATION
========================================================= */

let sheets = null;

if (
  GOOGLE_CLIENT_EMAIL &&
  GOOGLE_PRIVATE_KEY &&
  GOOGLE_SHEET_ID
) {
  const auth = new google.auth.JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });

  sheets = google.sheets({
    version: "v4",
    auth,
  });

  console.log("Google Sheets configuration loaded.");
} else {
  console.error("");
  console.error("====================================");
  console.error("GOOGLE SHEETS CONFIGURATION MISSING");
  console.error("====================================");
  console.error(
    "Check GOOGLE_CLIENT_EMAIL"
  );
  console.error(
    "Check GOOGLE_PRIVATE_KEY"
  );
  console.error(
    "Check GOOGLE_SHEET_ID"
  );
  console.error("====================================");
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Mahaveer Gold backend is running",
  });
});

/* =========================================================
   OWNER LOGIN
========================================================= */

app.post("/api/auth/login", (req, res) => {
  try {
    const mobile = String(
      req.body.mobile ||
        req.body.phone ||
        ""
    ).replace(/\D/g, "");

    const pin = String(
      req.body.pin || ""
    ).trim();

    /* -----------------------------------------------------
       VALIDATE MOBILE
    ----------------------------------------------------- */

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid 10 digit mobile number.",
      });
    }

    /* -----------------------------------------------------
       CHECK OWNER
    ----------------------------------------------------- */

    if (!OWNER_NUMBERS.includes(mobile)) {
      return res.status(403).json({
        success: false,
        message:
          "This mobile number is not authorized.",
      });
    }

    /* -----------------------------------------------------
       VALIDATE PIN
    ----------------------------------------------------- */

    if (
      pin.length < 4 ||
      pin.length > 30
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid PIN.",
      });
    }

    /* -----------------------------------------------------
       PIN MUST CONTAIN:
       ALPHABET + NUMBER + SPECIAL CHARACTER
    ----------------------------------------------------- */

    const validPinFormat =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

    if (!validPinFormat.test(pin)) {
      return res.status(400).json({
        success: false,
        message:
          "PIN must contain alphabet, number and special character.",
      });
    }

    /* -----------------------------------------------------
       CHECK USER-SPECIFIC PIN
    ----------------------------------------------------- */

    if (OWNER_PINS[mobile] !== pin) {
      return res.status(401).json({
        success: false,
        message:
          "Incorrect PIN for this mobile number.",
      });
    }

    /* -----------------------------------------------------
       LOGIN SUCCESS
    ----------------------------------------------------- */

    console.log("");
    console.log(
      "===================================="
    );
    console.log(
      "OWNER LOGIN SUCCESS"
    );
    console.log(
      "MOBILE:",
      mobile
    );
    console.log(
      "===================================="
    );
    console.log("");

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      mobile,
    });
  } catch (error) {
    console.error(
      "OWNER LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to login.",
    });
  }
});

/* =========================================================
   SAVE PAWN TICKET TO GOOGLE SHEETS
========================================================= */

app.post(
  "/api/pawn-tickets",
  async (req, res) => {
    try {
      if (!sheets) {
        return res.status(500).json({
          success: false,
          message:
            "Google Sheets is not configured correctly.",
        });
      }

      const ticketData = req.body;

      if (
        !ticketData ||
        typeof ticketData !== "object"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid pawn ticket data.",
        });
      }

      /* ---------------------------------------------------
         DECLARATION
      --------------------------------------------------- */

      if (
        ticketData.declarationAccepted !== true
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Declaration must be accepted before saving.",
        });
      }

      /* ---------------------------------------------------
         CUSTOMER ID
      --------------------------------------------------- */

      const customerId = String(
        ticketData.customerId || ""
      ).trim();

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message:
            "Customer ID is required.",
        });
      }

      /* ---------------------------------------------------
         CUSTOMER NAME
      --------------------------------------------------- */

      const customerName = String(
        ticketData.customerName || ""
      ).trim();

      if (!customerName) {
        return res.status(400).json({
          success: false,
          message:
            "Customer name is required.",
        });
      }

      /* ---------------------------------------------------
         LOAN AMOUNT
      --------------------------------------------------- */

      const principalAmount = Number(
        ticketData.principalAmount ??
          ticketData.loanAmount ??
          0
      );

      if (
        !Number.isFinite(
          principalAmount
        ) ||
        principalAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid loan amount is required.",
        });
      }

      /* ---------------------------------------------------
         CREATE TICKET ID
      --------------------------------------------------- */

      const ticketId =
        `MT-${Date.now()}-${Math.floor(
          Math.random() * 1000
        )}`;

      /* ---------------------------------------------------
         CREATE SAVED TICKET
      --------------------------------------------------- */

      const savedTicket = {
        id: ticketId,

        ...ticketData,

        customerId,

        customerName,

        principalAmount,

        loanAmount:
          principalAmount,

        paymentStatus:
          "ACTIVE",

        paidAt: "",

        savedAt:
          new Date().toISOString(),
      };

      /* ---------------------------------------------------
         CONVERT TICKET TO EXCEL/GOOGLE SHEETS ROW
      --------------------------------------------------- */

      const row = [
        savedTicket.id || "",
        savedTicket.customerId || "",
        savedTicket.customerName || "",
        savedTicket.customerMobile || "",
        savedTicket.customerPhone || "",
        savedTicket.address || "",
        savedTicket.principalAmount || "",
        savedTicket.loanAmount || "",
        savedTicket.interestRate || "",
        savedTicket.interest || "",
        savedTicket.totalAmount || "",
        savedTicket.paymentStatus || "ACTIVE",
        savedTicket.paidAt || "",
        savedTicket.declarationAccepted
          ? "YES"
          : "NO",
        savedTicket.savedAt || "",
        JSON.stringify(savedTicket),
      ];

      /* ---------------------------------------------------
         SAVE TO GOOGLE SHEETS
      --------------------------------------------------- */

      await sheets.spreadsheets.values.append({
        spreadsheetId:
          GOOGLE_SHEET_ID,

        range: "Sheet1!A:P",

        valueInputOption:
          "USER_ENTERED",

        insertDataOption:
          "INSERT_ROWS",

        requestBody: {
          values: [row],
        },
      });

      console.log("");
      console.log(
        "===================================="
      );
      console.log(
        "PAWN TICKET SAVED TO GOOGLE SHEETS"
      );
      console.log(
        "TICKET ID:",
        ticketId
      );
      console.log(
        "CUSTOMER:",
        customerName
      );
      console.log(
        "===================================="
      );
      console.log("");

      return res.status(201).json({
        success: true,
        message:
          "Pawn ticket saved successfully.",
        id: ticketId,
        ticket: savedTicket,
      });
    } catch (error) {
      console.error("");
      console.error(
        "SAVE PAWN TICKET ERROR:",
        error
      );
      console.error("");

      return res.status(500).json({
        success: false,
        message:
          "Server error while saving pawn ticket.",
      });
    }
  }
);

/* =========================================================
   GET ALL PAWN TICKETS FROM GOOGLE SHEETS
========================================================= */

app.get(
  "/api/pawn-tickets",
  async (req, res) => {
    try {
      if (!sheets) {
        return res.status(500).json({
          success: false,
          message:
            "Google Sheets is not configured correctly.",
        });
      }

      const result =
        await sheets.spreadsheets.values.get({
          spreadsheetId:
            GOOGLE_SHEET_ID,

          range: "Sheet1!A:P",
        });

      const rows =
        result.data.values || [];

      if (rows.length <= 1) {
        return res.status(200).json({
          success: true,
          count: 0,
          tickets: [],
        });
      }

      const tickets = rows
        .slice(1)
        .map((row) => {
          try {
            if (row[15]) {
              return JSON.parse(row[15]);
            }

            return {
              id: row[0] || "",
              customerId:
                row[1] || "",
              customerName:
                row[2] || "",
              customerMobile:
                row[3] || "",
              principalAmount:
                Number(row[6]) || 0,
              loanAmount:
                Number(row[7]) || 0,
              paymentStatus:
                row[11] || "ACTIVE",
              paidAt:
                row[12] || null,
              savedAt:
                row[14] || "",
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      return res.status(200).json({
        success: true,
        count: tickets.length,
        tickets,
      });
    } catch (error) {
      console.error(
        "GET ALL TICKETS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to read pawn tickets.",
      });
    }
  }
);

/* =========================================================
   GET CUSTOMER LOAN HISTORY
========================================================= */

app.get(
  "/api/pawn-tickets/customer/:customerId",
  async (req, res) => {
    try {
      if (!sheets) {
        return res.status(500).json({
          success: false,
          message:
            "Google Sheets is not configured correctly.",
        });
      }

      const customerId =
        String(
          req.params.customerId || ""
        ).trim();

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message:
            "Customer ID is required.",
        });
      }

      const result =
        await sheets.spreadsheets.values.get({
          spreadsheetId:
            GOOGLE_SHEET_ID,

          range: "Sheet1!A:P",
        });

      const rows =
        result.data.values || [];

      if (rows.length <= 1) {
        return res.status(200).json({
          success: true,
          isNewCustomer: true,
          customerId,
          count: 0,
          tickets: [],
          message:
            "New customer. No previous loans found.",
        });
      }

      const tickets = rows
        .slice(1)
        .map((row) => {
          try {
            if (row[15]) {
              return JSON.parse(row[15]);
            }

            return null;
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .filter(
          (ticket) =>
            String(
              ticket.customerId || ""
            )
              .trim()
              .toLowerCase() ===
            customerId.toLowerCase()
        )
        .map((ticket) => ({
          ...ticket,

          paymentStatus:
            ticket.paymentStatus ||
            "ACTIVE",

          paidAt:
            ticket.paidAt ||
            null,
        }));

      if (tickets.length === 0) {
        return res.status(200).json({
          success: true,
          isNewCustomer: true,
          customerId,
          count: 0,
          tickets: [],
          message:
            "New customer. No previous loans found.",
        });
      }

      return res.status(200).json({
        success: true,
        isNewCustomer: false,
        customerId,
        count: tickets.length,
        tickets,
        message:
          "Previous customer loans found.",
      });
    } catch (error) {
      console.error(
        "CUSTOMER HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve customer loan history.",
      });
    }
  }
);

/* =========================================================
   GET SINGLE PAWN TICKET
========================================================= */

app.get(
  "/api/pawn-tickets/:id",
  async (req, res) => {
    try {
      if (!sheets) {
        return res.status(500).json({
          success: false,
          message:
            "Google Sheets is not configured correctly.",
        });
      }

      const ticketId =
        String(
          req.params.id || ""
        ).trim();

      const result =
        await sheets.spreadsheets.values.get({
          spreadsheetId:
            GOOGLE_SHEET_ID,

          range: "Sheet1!A:P",
        });

      const rows =
        result.data.values || [];

      const foundRow =
        rows
          .slice(1)
          .find(
            (row) =>
              String(
                row[0] || ""
              ).trim() === ticketId
          );

      if (!foundRow) {
        return res.status(404).json({
          success: false,
          message:
            "Pawn ticket not found.",
        });
      }

      let ticket = null;

      try {
        ticket = foundRow[15]
          ? JSON.parse(foundRow[15])
          : null;
      } catch {
        ticket = null;
      }

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message:
            "Pawn ticket data is invalid.",
        });
      }

      return res.status(200).json({
        success: true,
        ticket,
      });
    } catch (error) {
      console.error(
        "GET SINGLE TICKET ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve pawn ticket.",
      });
    }
  }
);

/* =========================================================
   START SERVER
========================================================= */

app.listen(
  PORT,
  () => {
    console.log("");
    console.log(
      "===================================="
    );
    console.log(
      "Mahaveer Gold backend is running"
    );
    console.log(
      `http://localhost:${PORT}`
    );
    console.log(
      "===================================="
    );

    console.log(
      "Authorized owner numbers:"
    );

    console.log(
      OWNER_NUMBERS
    );

    console.log("");

    console.log(
      "LOGIN MODE: USER-SPECIFIC PIN"
    );

    console.log(
      "GOOGLE SHEETS: ENABLED"
    );

    console.log(
      "===================================="
    );
  }
);