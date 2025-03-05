const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();

const Proposal = require("./models/Proposal");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/shidduchim")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "documentFile") {
      if (
        file.mimetype === "application/pdf" ||
        file.mimetype === "application/msword" ||
        file.mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        cb(null, true);
      } else {
        cb(
          new Error(
            "Invalid document file type. Only PDF and Word documents are allowed."
          )
        );
      }
    } else if (file.fieldname === "imageFile") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Invalid image file type. Only images are allowed."));
      }
    } else {
      cb(new Error("Unexpected field"));
    }
  },
});

// Routes

// Create new proposal
app.post(
  "/proposals",
  upload.fields([
    { name: "documentFile", maxCount: 1 },
    { name: "imageFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const proposalData = {
        name: req.body.name,
        yeshiva: req.body.yeshiva,
        shadchan: req.body.shadchan,
        details: req.body.details,
        notes: req.body.notes,
      };

      if (req.files.documentFile) {
        const docFile = req.files.documentFile[0];
        proposalData.documentFile = {
          filename: docFile.originalname,
          contentType: docFile.mimetype,
          data: docFile.buffer,
        };
      }

      if (req.files.imageFile) {
        const imgFile = req.files.imageFile[0];
        proposalData.imageFile = {
          filename: imgFile.originalname,
          contentType: imgFile.mimetype,
          data: imgFile.buffer,
        };
      }

      const proposal = new Proposal(proposalData);
      await proposal.save();
      res
        .status(201)
        .json({ message: "Proposal created successfully", id: proposal.id });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Get all proposals (without file data)
app.get("/proposals", async (req, res) => {
  try {
    const proposals = await Proposal.find(
      {},
      {
        documentFile: 0,
        imageFile: 0,
      }
    );
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single proposal
app.get("/proposals/:id", async (req, res) => {
  try {
    const proposal = await Proposal.findById(
      new mongoose.Types.ObjectId(req.params.id)
    );
    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get document file
app.get("/proposals/:id/document", async (req, res) => {
  try {
    const proposal = await Proposal.findById(
      new mongoose.Types.ObjectId(req.params.id)
    );
    if (!proposal || !proposal.documentFile) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.set("Content-Type", proposal.documentFile.contentType);
    res.send(proposal.documentFile.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get image file
app.get("/proposals/:id/image", async (req, res) => {
  try {
    const proposal = await Proposal.findById(
      new mongoose.Types.ObjectId(req.params.id)
    );
    if (!proposal || !proposal.imageFile) {
      return res.status(404).json({ error: "Image not found" });
    }
    res.set("Content-Type", proposal.imageFile.contentType);
    res.send(proposal.imageFile.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update proposal
app.put(
  "/proposals/:id",
  upload.fields([
    { name: "documentFile", maxCount: 1 },
    { name: "imageFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const updateData = {
        name: req.body.name,
        yeshiva: req.body.yeshiva,
        shadchan: req.body.shadchan,
        details: req.body.details,
        notes: req.body.notes,
      };

      if (req.files.documentFile) {
        const docFile = req.files.documentFile[0];
        updateData.documentFile = {
          filename: docFile.originalname,
          contentType: docFile.mimetype,
          data: docFile.buffer,
        };
      }

      if (req.files.imageFile) {
        const imgFile = req.files.imageFile[0];
        updateData.imageFile = {
          filename: imgFile.originalname,
          contentType: imgFile.mimetype,
          data: imgFile.buffer,
        };
      }

      const proposal = await Proposal.findByIdAndUpdate(
        new mongoose.Types.ObjectId(new mongoose.Types.ObjectId(req.params.id)),
        updateData,
        { new: true }
      );

      if (!proposal) {
        return res.status(404).json({ error: "Proposal not found" });
      }

      res.json({ message: "Proposal updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete proposal
app.delete("/proposals/:id", async (req, res) => {
  try {
    const proposal = await Proposal.findByIdAndDelete(
      new mongoose.Types.ObjectId(req.params.id)
    );
    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }
    res.json({ message: "Proposal deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
