const express = require("express");

const app = express();

const cors = require("cors");
const corsOptions = {
  origin: "*",
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

const { initializeDatabase } = require("./db/db.connect");
const Tag = require("./models/model.tags");
const Comment = require("./models/models.comments");
const Lead = require("./models/models.leads");
const SalesAgent = require("./models/models.saleAgents");

app.use(express.json());

initializeDatabase();

app.get("/", (req, res) => {
  res.status(201).json({ message: "Anvaya backend server is Live..." });
});

//for adding new agent
app.post("/agents", async (req, res) => {
  try {
    const { name, email } = req.body;
    const newAgent = new SalesAgent({ name, email });
    const savedAgent = await newAgent.save();

    res.status(201).json({
      message: "Agent added successfully",
      agent: savedAgent,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to add agent" });
  }
});

//for get agents details
app.get("/agents", async (req, res) => {
  try {
    const agents = await SalesAgent.find();
    res.status(200).json(agents);
  } catch (error) {
    res.status(500).json({ error: "failed to fetch agents" });
  }
});

//for adding comments by id
app.post("/leads/:id/comments", async (req, res) => {
  try {
    const leadId = req.params.id;
    const commentText = req.body.commentText;

    const lead = await Lead.findById(leadId);
    const agent = await SalesAgent.findById(lead.salesAgent);

    const comment = new Comment({
      lead: leadId,
      author: agent._id,
      commentText: commentText,
    });

    const savedComment = await comment.save();
    res.json(savedComment);
  } catch (error) {
    res.json({ error: "Error adding comment" });
  }
});

//for gets comments
app.get("/leads/:id/comments", async (req, res) => {
  try {
    const leadId = req.params.id;
    const comments = await Comment.find({ lead: leadId }).populate("author");

    res.json(comments);
  } catch (error) {
    res.json({ error: "error getting comments" });
  }
});

//for create lead
app.post("/leads", async (req, res) => {
  try {
    const { name, source, salesAgent, status, tags, timeToClose, priority } =
      req.body;
    if (
      !name ||
      !source ||
      !salesAgent ||
      !status ||
      !tags ||
      !timeToClose ||
      !priority
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const agent = await SalesAgent.findById(salesAgent);
    if (!agent) {
      return res.status(404).json({ error: "Sales agent not found." });
    }

    const newLead = new Lead({
      name,
      source,
      salesAgent,
      status,
      tags,
      timeToClose,
      priority,
    });

    const savedLead = await newLead.save();
    res.status(201).json(savedLead);
  } catch (error) {
    res.json({ error: "Error creating lead." });
  }
});

//for get leads
app.get("/leads", async (req, res) => {
  try {
    const leads = await Lead.find().populate("salesAgent", "name");
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ error: "Error getting leads." });
  }
});

//for update lead by id
app.put("/leads/:id", async(req,res)=>{
  try{
    const leadId= req.params.id;
    const updates=req.body

    const updatedLead=await Lead.findByIdAndUpdate(leadId,updates,{now:true}).populate("salesAgent","name")

  }catch{
    res.status(500).json({error:"Error updating lead."})
  }
})

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
