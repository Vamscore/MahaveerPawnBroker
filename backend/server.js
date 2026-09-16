import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";
import { Readable } from "stream";

/* =========================================================
   ENVIRONMENT
========================================================= */

if (process.env.VERCEL) {
  dotenv.config();
} else {
  dotenv.config({ path: "backend/.env" });
}

/* =========================================================
   APP
========================================================= */

const app = express();

const PORT = process.env.PORT || 5000;

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
    limit: "15mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "15mb",
  })
);

/* =========================================================
   ENVIRONMENT VARIABLES
========================================================= */

const GOOGLE_SHEET_ID =
  process.env.GOOGLE_SHEET_ID;

const GOOGLE_SHEET_NAME =
  process.env.GOOGLE_SHEET_NAME || "Sheet1";

const GOOGLE_SERVICE_ACCOUNT_EMAIL =
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

const GOOGLE_PRIVATE_KEY =
  process.env.GOOGLE_PRIVATE_KEY
    ?.replace(/\\n/g, "\n")
    .replace(/^"|"$/g, "");

const GOOGLE_DRIVE_FOLDER_ID =
  process.env.GOOGLE_DRIVE_FOLDER_ID || "";

const GOOGLE_OAUTH_CLIENT_ID =
  process.env.GOOGLE_OAUTH_CLIENT_ID;

const GOOGLE_OAUTH_CLIENT_SECRET =
  process.env.GOOGLE_OAUTH_CLIENT_SECRET;

const GOOGLE_OAUTH_REDIRECT_URI =
  process.env.GOOGLE_OAUTH_REDIRECT_URI ||
  "http://localhost:5000/oauth2callback";

const GOOGLE_OAUTH_REFRESH_TOKEN =
  process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

/* =========================================================
   OWNER ACCOUNTS
========================================================= */

const OWNER_ACCOUNTS = [
  {
    mobile: process.env.OWNER_1_MOBILE,
    pin: process.env.OWNER_1_PIN,
  },
  {
    mobile: process.env.OWNER_2_MOBILE,
    pin: process.env.OWNER_2_PIN,
  },
  {
    mobile: process.env.OWNER_3_MOBILE,
    pin: process.env.OWNER_3_PIN,
  },
].filter(
  (owner) =>
    owner.mobile &&
    owner.pin
);

/* =========================================================
   GOOGLE SHEETS
   SERVICE ACCOUNT
========================================================= */

let sheets = null;

if (
  GOOGLE_SHEET_ID &&
  GOOGLE_SERVICE_ACCOUNT_EMAIL &&
  GOOGLE_PRIVATE_KEY
) {
  try {
    const sheetsAuth =
      new google.auth.JWT({
        email:
          GOOGLE_SERVICE_ACCOUNT_EMAIL,

        key:
          GOOGLE_PRIVATE_KEY,

        scopes: [
          "https://www.googleapis.com/auth/spreadsheets",
        ],
      });

    sheets =
      google.sheets({
        version: "v4",
        auth: sheetsAuth,
      });

    console.log(
      "GOOGLE SHEETS CLIENT: READY"
    );
  } catch (error) {
    console.error(
      "GOOGLE SHEETS AUTH ERROR:",
      error.message
    );
  }
} else {
  console.warn(
    "GOOGLE SHEETS CLIENT: NOT CONFIGURED"
  );
}

/* =========================================================
   GOOGLE DRIVE
   OAUTH USER ACCOUNT
========================================================= */

let drive = null;

if (
  GOOGLE_OAUTH_CLIENT_ID &&
  GOOGLE_OAUTH_CLIENT_SECRET &&
  GOOGLE_OAUTH_REFRESH_TOKEN
) {
  try {
    const oauth2Client =
      new google.auth.OAuth2(
        GOOGLE_OAUTH_CLIENT_ID,
        GOOGLE_OAUTH_CLIENT_SECRET,
        GOOGLE_OAUTH_REDIRECT_URI
      );

    oauth2Client.setCredentials({
      refresh_token:
        GOOGLE_OAUTH_REFRESH_TOKEN,
    });

    drive =
      google.drive({
        version: "v3",
        auth: oauth2Client,
      });

    console.log(
      "GOOGLE DRIVE CLIENT: OAUTH READY"
    );
  } catch (error) {
    console.error(
      "GOOGLE DRIVE OAUTH ERROR:",
      error.message
    );
  }
} else {
  console.warn(
    "GOOGLE DRIVE CLIENT: NOT CONFIGURED"
  );
}

/* =========================================================
   SHEET RANGE
========================================================= */

const SHEET_RANGE =
  `${GOOGLE_SHEET_NAME}!A:AB`;

/* =========================================================
   SHEET HEADERS
========================================================= */

const SHEET_HEADERS = [
  "id",
  "customerId",
  "customerName",
  "fatherHusbandName",
  "fullAddress",
  "redemptionTime",
  "particulars",
  "annualIncome",
  "goldWeight",
  "loanTenure",
  "goldPrice",
  "interestRate",
  "principalAmount",
  "loanAmount",
  "monthlyInterest",
  "totalInterest",
  "totalAmountToPay",
  "amountInWords",
  "totalAmountInWords",
  "ticketNumber",
  "ticketDate",
  "declarationAccepted",
  "paymentStatus",
  "paidAt",
  "createdAt",
  "savedAt",
  "personPhotoUrl",
  "jewelleryPhotoUrl",
];

/* =========================================================
   HELPERS
========================================================= */

function checkSheetsConnection(res) {
  if (!sheets) {
    res.status(500).json({
      success: false,
      message:
        "Google Sheets is not configured. Check Vercel Environment Variables.",
    });

    return false;
  }

  return true;
}

function checkDriveConnection() {
  if (!drive) {
    throw new Error(
      "Google Drive OAuth is not configured. Check GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET and GOOGLE_OAUTH_REFRESH_TOKEN."
    );
  }
}

/* =========================================================
   ENSURE SHEET HEADERS
========================================================= */

async function ensureSheetHeaders() {
  if (!sheets) {
    throw new Error(
      "Google Sheets client is not configured."
    );
  }

  const response =
    await sheets.spreadsheets.values.get({
      spreadsheetId:
        GOOGLE_SHEET_ID,

      range:
        `${GOOGLE_SHEET_NAME}!A1:AB1`,
    });

  const firstRow =
    response.data.values?.[0] || [];

  if (firstRow.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId:
        GOOGLE_SHEET_ID,

      range:
        `${GOOGLE_SHEET_NAME}!A1:AB1`,

      valueInputOption: "RAW",

      requestBody: {
        values: [
          SHEET_HEADERS,
        ],
      },
    });

    return;
  }

  if (
    firstRow[26] !==
      "personPhotoUrl" ||
    firstRow[27] !==
      "jewelleryPhotoUrl"
  ) {
    await sheets.spreadsheets.values.update({
      spreadsheetId:
        GOOGLE_SHEET_ID,

      range:
        `${GOOGLE_SHEET_NAME}!AA1:AB1`,

      valueInputOption: "RAW",

      requestBody: {
        values: [
          [
            "personPhotoUrl",
            "jewelleryPhotoUrl",
          ],
        ],
      },
    });
  }
}

/* =========================================================
   GET SHEET ROWS
========================================================= */

async function getSheetRows() {
  if (!sheets) {
    throw new Error(
      "Google Sheets is not configured."
    );
  }

  const response =
    await sheets.spreadsheets.values.get({
      spreadsheetId:
        GOOGLE_SHEET_ID,

      range:
        SHEET_RANGE,
    });

  return (
    response.data.values || []
  );
}

/* =========================================================
   ROW -> TICKET
========================================================= */

function rowToTicket(row) {
  return {
    id:
      row[0] || "",

    customerId:
      row[1] || "",

    customerName:
      row[2] || "",

    fatherHusbandName:
      row[3] || "",

    fullAddress:
      row[4] || "",

    redemptionTime:
      row[5] || "",

    particulars:
      row[6] || "",

    annualIncome:
      row[7] || "",

    goldWeight:
      row[8] || "",

    loanTenure:
      Number(row[9] || 0),

    goldPrice:
      row[10] || "",

    interestRate:
      Number(row[11] || 0),

    principalAmount:
      Number(row[12] || 0),

    loanAmount:
      Number(row[13] || 0),

    monthlyInterest:
      Number(row[14] || 0),

    totalInterest:
      Number(row[15] || 0),

    totalAmountToPay:
      Number(row[16] || 0),

    amountInWords:
      row[17] || "",

    totalAmountInWords:
      row[18] || "",

    ticketNumber:
      row[19] || "",

    ticketDate:
      row[20] || "",

    declarationAccepted:
      String(
        row[21] || ""
      ).toLowerCase() === "true",

    paymentStatus:
      row[22] || "ACTIVE",

    paidAt:
      row[23] || null,

    createdAt:
      row[24] || "",

    savedAt:
      row[25] || "",

    personPhotoUrl:
      row[26] || "",

    jewelleryPhotoUrl:
      row[27] || "",
  };
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,

    message:
      "Mahaveer Gold backend is running",

    googleSheets:
      sheets !== null,

    googleDrive:
      drive !== null,

    driveStorage:
      drive
        ? "OAuth User Drive"
        : "Not configured",

    owners:
      OWNER_ACCOUNTS.length,

    environment:
      process.env.VERCEL
        ? "Vercel"
        : "Local",
  });
});

/* =========================================================
   OWNER LOGIN
========================================================= */

app.post(
  "/api/auth/login",
  (req, res) => {
    try {
      const mobile =
        String(
          req.body.mobile ||
            req.body.phone ||
            ""
        ).replace(/\D/g, "");

      const pin =
        String(
          req.body.pin || ""
        ).trim();

      if (
        !/^[6-9]\d{9}$/.test(
          mobile
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Enter a valid 10 digit mobile number.",
        });
      }

      const owner =
        OWNER_ACCOUNTS.find(
          (account) =>
            String(account.mobile)
              .replace(/\D/g, "") ===
            mobile
        );

      if (!owner) {
        return res.status(403).json({
          success: false,
          message:
            "This mobile number is not authorized.",
        });
      }

      if (
        pin.length < 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            "PIN must contain at least 6 characters.",
        });
      }

      if (
        pin.length > 30
      ) {
        return res.status(400).json({
          success: false,
          message:
            "PIN cannot exceed 30 characters.",
        });
      }

      if (
        pin !== String(owner.pin).trim()
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Incorrect PIN.",
        });
      }

      console.log(
        `OWNER LOGIN SUCCESS: ${mobile}`
      );

      return res.status(200).json({
        success: true,

        message:
          "Login successful.",

        mobile,
      });
    } catch (error) {
      console.error(
        "OWNER LOGIN ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to login.",
      });
    }
  }
);

/* =========================================================
   DRIVE PHOTO UPLOAD
========================================================= */

async function uploadPhotoToDrive(
  dataUrl,
  fileName
) {
  if (!dataUrl) {
    return "";
  }

  checkDriveConnection();

  const match =
    String(dataUrl).match(
      /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
    );

  if (!match) {
    throw new Error(
      "Invalid image data received from frontend."
    );
  }

  const mimeType =
    match[1];

  const base64Data =
    match[2];

  const buffer =
    Buffer.from(
      base64Data,
      "base64"
    );

  if (!buffer.length) {
    throw new Error(
      "Image data is empty."
    );
  }

  if (
    buffer.length >
    8 * 1024 * 1024
  ) {
    throw new Error(
      "Each uploaded photo must be smaller than 8 MB."
    );
  }

  const requestBody = {
    name: fileName,
    mimeType,
  };

  if (
    GOOGLE_DRIVE_FOLDER_ID
  ) {
    requestBody.parents = [
      GOOGLE_DRIVE_FOLDER_ID,
    ];
  }

  console.log(
    `Uploading ${fileName} to Google Drive...`
  );

  const createdFile =
    await drive.files.create({
      requestBody,

      media: {
        mimeType,

        body:
          Readable.from(
            buffer
          ),
      },

      fields:
        "id,name,webViewLink,webContentLink",
    });

  const fileId =
    createdFile.data.id;

  if (!fileId) {
    throw new Error(
      "Google Drive did not return a file ID."
    );
  }

  try {
    await drive.permissions.create({
      fileId,

      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
  } catch (permissionError) {
    console.warn(
      "DRIVE PUBLIC PERMISSION WARNING:",
      permissionError.message
    );
  }

  console.log(
    `Drive upload successful: ${fileName}`
  );

  return `https://drive.google.com/file/d/${fileId}/view`;
}

/* =========================================================
   SAVE PAWN TICKET
========================================================= */

app.post(
  "/api/pawn-tickets",
  async (req, res) => {
    try {
      if (
        !checkSheetsConnection(res)
      ) {
        return;
      }

      const ticket =
        req.body;

      if (
        !ticket ||
        typeof ticket !== "object"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid pawn ticket data.",
        });
      }

      if (
        ticket.declarationAccepted !== true
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Declaration must be accepted before saving.",
        });
      }

      const customerId =
        String(
          ticket.customerId || ""
        ).trim();

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message:
            "Customer ID is required.",
        });
      }

      const customerName =
        String(
          ticket.customerName || ""
        ).trim();

      if (!customerName) {
        return res.status(400).json({
          success: false,
          message:
            "Customer name is required.",
        });
      }

      const loanAmount =
        Number(
          ticket.loanAmount ??
            ticket.principalAmount ??
            0
        );

      if (
        !Number.isFinite(
          loanAmount
        ) ||
        loanAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid loan amount is required.",
        });
      }

      /* -----------------------------------------------------
         INTEREST
      ----------------------------------------------------- */

      const interestRate =
        Number(
          ticket.interestRate || 0
        );

      const loanTenure =
        Number(
          ticket.loanTenure || 0
        );

      if (
        !Number.isFinite(
          interestRate
        ) ||
        interestRate < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid interest rate.",
        });
      }

      if (
        !Number.isFinite(
          loanTenure
        ) ||
        loanTenure < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid loan tenure.",
        });
      }

      const monthlyInterest =
        loanAmount *
        (interestRate / 100);

      const totalInterest =
        monthlyInterest *
        loanTenure;

      const totalAmountToPay =
        loanAmount +
        totalInterest;

      /* -----------------------------------------------------
         ID / DATES
      ----------------------------------------------------- */

      const id =
        `MT-${Date.now()}-${Math.floor(
          Math.random() * 1000
        )}`;

      const savedAt =
        new Date().toISOString();

      const createdAt =
        ticket.createdAt ||
        savedAt;

      /* -----------------------------------------------------
         PHOTOS
      ----------------------------------------------------- */

      let personPhotoUrl = "";

      let jewelleryPhotoUrl = "";

      if (
        ticket.personPhoto
      ) {
        personPhotoUrl =
          await uploadPhotoToDrive(
            ticket.personPhoto,
            `${id}-customer-photo.jpg`
          );
      }

      if (
        ticket.jewelleryPhoto
      ) {
        jewelleryPhotoUrl =
          await uploadPhotoToDrive(
            ticket.jewelleryPhoto,
            `${id}-jewellery-photo.jpg`
          );
      }

      /* -----------------------------------------------------
         FINAL TICKET
      ----------------------------------------------------- */

      const savedTicket = {
        id,

        customerId,

        customerName,

        fatherHusbandName:
          ticket.fatherHusbandName ||
          "",

        fullAddress:
          ticket.fullAddress ||
          "",

        redemptionTime:
          ticket.redemptionTime ||
          "",

        particulars:
          ticket.particulars ||
          "",

        annualIncome:
          ticket.annualIncome ||
          "",

        goldWeight:
          ticket.goldWeight ||
          "",

        loanTenure,

        goldPrice:
          ticket.goldPrice ||
          "",

        interestRate,

        principalAmount:
          loanAmount,

        loanAmount,

        monthlyInterest,

        totalInterest,

        totalAmountToPay,

        amountInWords:
          ticket.amountInWords ||
          "",

        totalAmountInWords:
          ticket.totalAmountInWords ||
          "",

        ticketNumber:
          ticket.ticketNumber ||
          "",

        ticketDate:
          ticket.ticketDate ||
          "",

        declarationAccepted:
          true,

        paymentStatus:
          "ACTIVE",

        paidAt:
          null,

        createdAt,

        savedAt,

        personPhotoUrl,

        jewelleryPhotoUrl,
      };

      /* -----------------------------------------------------
         HEADERS
      ----------------------------------------------------- */

      await ensureSheetHeaders();

      /* -----------------------------------------------------
         SAVE TO SHEETS
      ----------------------------------------------------- */

      await sheets.spreadsheets.values.append({
        spreadsheetId:
          GOOGLE_SHEET_ID,

        range:
          SHEET_RANGE,

        valueInputOption:
          "RAW",

        insertDataOption:
          "INSERT_ROWS",

        requestBody: {
          values: [
            [
              savedTicket.id,
              savedTicket.customerId,
              savedTicket.customerName,
              savedTicket.fatherHusbandName,
              savedTicket.fullAddress,
              savedTicket.redemptionTime,
              savedTicket.particulars,
              savedTicket.annualIncome,
              savedTicket.goldWeight,
              savedTicket.loanTenure,
              savedTicket.goldPrice,
              savedTicket.interestRate,
              savedTicket.principalAmount,
              savedTicket.loanAmount,
              savedTicket.monthlyInterest,
              savedTicket.totalInterest,
              savedTicket.totalAmountToPay,
              savedTicket.amountInWords,
              savedTicket.totalAmountInWords,
              savedTicket.ticketNumber,
              savedTicket.ticketDate,
              savedTicket.declarationAccepted,
              savedTicket.paymentStatus,
              "",
              savedTicket.createdAt,
              savedTicket.savedAt,
              savedTicket.personPhotoUrl,
              savedTicket.jewelleryPhotoUrl,
            ],
          ],
        },
      });

      console.log(
        `PAWN TICKET SAVED: ${id}`
      );

      return res.status(201).json({
        success: true,

        message:
          "Pawn ticket saved successfully.",

        id,

        ticket:
          savedTicket,
      });
    } catch (error) {
      console.error(
        "SAVE PAWN TICKET ERROR:",
        error
      );

      const message =
        String(
          error?.message || ""
        );

      if (
        message.toLowerCase().includes(
          "storage quota"
        )
      ) {
        return res.status(500).json({
          success: false,

          message:
            "Google Drive storage error. Make sure Drive is using your OAuth user account and the refresh token is valid.",
        });
      }

      return res.status(500).json({
        success: false,

        message:
          message ||
          "Server error while saving pawn ticket.",
      });
    }
  }
);

/* =========================================================
   MARK LOAN AS PAID
========================================================= */

app.patch(
  "/api/pawn-tickets/:id/paid",
  async (req, res) => {
    try {
      if (
        !checkSheetsConnection(res)
      ) {
        return;
      }

      const ticketId =
        String(
          req.params.id || ""
        ).trim();

      if (!ticketId) {
        return res.status(400).json({
          success: false,
          message:
            "Ticket ID is required.",
        });
      }

      await ensureSheetHeaders();

      const rows =
        await getSheetRows();

      if (
        rows.length <= 1
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Pawn ticket not found.",
        });
      }

      const rowIndex =
        rows.findIndex(
          (row, index) =>
            index > 0 &&
            String(
              row[0] || ""
            ).trim() ===
              ticketId
        );

      if (
        rowIndex === -1
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Pawn ticket not found.",
        });
      }

      const currentRow =
        rows[rowIndex];

      if (
        String(
          currentRow[22] || ""
        ).toUpperCase() ===
        "PAID"
      ) {
        return res.status(200).json({
          success: true,

          message:
            "Loan is already marked as paid.",

          ticket:
            rowToTicket(
              currentRow
            ),
        });
      }

      const paidAt =
        new Date().toISOString();

      const updatedTicket =
        rowToTicket(
          currentRow
        );

      updatedTicket.paymentStatus =
        "PAID";

      updatedTicket.paidAt =
        paidAt;

      await sheets.spreadsheets.values.update({
        spreadsheetId:
          GOOGLE_SHEET_ID,

        range:
          `${GOOGLE_SHEET_NAME}!W${
            rowIndex + 1
          }:X${
            rowIndex + 1
          }`,

        valueInputOption:
          "RAW",

        requestBody: {
          values: [
            [
              "PAID",
              paidAt,
            ],
          ],
        },
      });

      console.log(
        `LOAN MARKED PAID: ${ticketId}`
      );

      return res.status(200).json({
        success: true,

        message:
          "Loan marked as paid successfully.",

        ticket:
          updatedTicket,
      });
    } catch (error) {
      console.error(
        "MARK LOAN AS PAID ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to mark loan as paid.",
      });
    }
  }
);

/* =========================================================
   CUSTOMER HISTORY
========================================================= */

app.get(
  "/api/pawn-tickets/customer/:customerId",
  async (req, res) => {
    try {
      if (
        !checkSheetsConnection(res)
      ) {
        return;
      }

      const customerId =
        String(
          req.params.customerId ||
            ""
        ).trim();

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message:
            "Customer ID is required.",
        });
      }

      await ensureSheetHeaders();

      const rows =
        await getSheetRows();

      const customerTickets =
        rows
          .slice(1)
          .filter(
            (row) =>
              String(
                row[1] || ""
              )
                .trim()
                .toLowerCase() ===
              customerId.toLowerCase()
          )
          .map(rowToTicket);

      if (
        customerTickets.length === 0
      ) {
        return res.status(200).json({
          success: true,

          isNewCustomer:
            true,

          customerId,

          count: 0,

          tickets: [],

          message:
            "New customer. No previous loans found.",
        });
      }

      return res.status(200).json({
        success: true,

        isNewCustomer:
          false,

        customerId,

        count:
          customerTickets.length,

        tickets:
          customerTickets,

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
   GET ALL PAWN TICKETS
========================================================= */

app.get(
  "/api/pawn-tickets",
  async (req, res) => {
    try {
      if (
        !checkSheetsConnection(res)
      ) {
        return;
      }

      await ensureSheetHeaders();

      const rows =
        await getSheetRows();

      const tickets =
        rows
          .slice(1)
          .filter(
            (row) =>
              row.length > 0 &&
              row[0]
          )
          .map(rowToTicket);

      return res.status(200).json({
        success: true,

        count:
          tickets.length,

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
   GET SINGLE PAWN TICKET
========================================================= */

app.get(
  "/api/pawn-tickets/:id",
  async (req, res) => {
    try {
      if (
        !checkSheetsConnection(res)
      ) {
        return;
      }

      const ticketId =
        String(
          req.params.id || ""
        ).trim();

      if (!ticketId) {
        return res.status(400).json({
          success: false,
          message:
            "Ticket ID is required.",
        });
      }

      await ensureSheetHeaders();

      const rows =
        await getSheetRows();

      const row =
        rows
          .slice(1)
          .find(
            (item) =>
              String(
                item[0] || ""
              ).trim() ===
              ticketId
          );

      if (!row) {
        return res.status(404).json({
          success: false,

          message:
            "Pawn ticket not found.",
        });
      }

      return res.status(200).json({
        success: true,

        ticket:
          rowToTicket(row),
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
   OAUTH STATUS
========================================================= */

app.get(
  "/api/health/google",
  (req, res) => {
    return res.status(200).json({
      success: true,

      googleSheets:
        sheets !== null,

      googleDrive:
        drive !== null,

      sheetIdConfigured:
        Boolean(GOOGLE_SHEET_ID),

      driveFolderConfigured:
        Boolean(
          GOOGLE_DRIVE_FOLDER_ID
        ),

      oauthConfigured:
        Boolean(
          GOOGLE_OAUTH_CLIENT_ID &&
          GOOGLE_OAUTH_CLIENT_SECRET &&
          GOOGLE_OAUTH_REFRESH_TOKEN
        ),
    });
  }
);

/* =========================================================
   404 HANDLER
========================================================= */

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,

      message:
        "API route not found.",

      path:
        req.originalUrl,
    });
  }
);

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
  (error, req, res, next) => {
    console.error(
      "UNHANDLED EXPRESS ERROR:",
      error
    );

    if (
      res.headersSent
    ) {
      return next(error);
    }

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Internal server error.",
    });
  }
);

/* =========================================================
   LOCAL SERVER
========================================================= */

if (!process.env.VERCEL) {
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
        "OWNER ACCOUNTS:",
        OWNER_ACCOUNTS.length
      );

      console.log(
        "GOOGLE SHEETS:",
        sheets
          ? "CONNECTED"
          : "NOT CONFIGURED"
      );

      console.log(
        "GOOGLE DRIVE:",
        drive
          ? "OAUTH CONNECTED"
          : "NOT CONFIGURED"
      );

      console.log(
        "DRIVE FOLDER:",
        GOOGLE_DRIVE_FOLDER_ID
          ? "CONFIGURED"
          : "NOT CONFIGURED"
      );

      console.log(
        "SHEET:",
        GOOGLE_SHEET_NAME
      );

      console.log(
        "LOGIN MODE:",
        "OWNER MOBILE + PIN"
      );

      console.log(
        "===================================="
      );
      console.log("");
    }
  );
}

/* =========================================================
   VERCEL EXPORT
========================================================= */

export default app;