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
app.put("/leads/:id", async (req, res) => {
  try {
    const leadId = req.params.id;
    const updates = req.body;

    const updatedLead = await Lead.findByIdAndUpdate(leadId, updates, {
      now: true,
    }).populate("salesAgent", "name");

    if (!updatedLead) {
      return res.status(404).json({ error: "Lead not found." });
    }

    res.status(200).json(updatedLead);
  } catch {
    res.status(500).json({ error: "Error updating lead." });
  }
});

//for deleting lead by id
app.delete("/leads/:id", async (req, res) => {
  try {
    const leadId = req.params.id;

    const deletedLead = await Lead.findByIdAndDelete(leadId);

    if (!deletedLead) {
      return res.status(404).json({ error: "Lead not found." });
    }

    res.status(200).json({ message: "Lead deleted successfully." });
  } catch {
    res.status(500).json({ error: "Error deleting lead." });
  }
});

//get report of leads in the pipeline and closed leads
app.get("/report/pipeline", async (req, res) => {
  try {
    const allLeads = await Lead.find();
    const activeLeads = allLeads.filter((lead) => lead.status !== "Closed");
    const closedLeads = allLeads.filter((lead) => lead.status === "Closed");

    res.status(200).json({
      totalClosedLeads: closedLeads.length,
      totalLeadInPipeline: activeLeads.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Something went wrong. Please try again later." });
  }
});

//for get closed leads from 7 days ago by sales agent 
app.get("/report/last-week", async (req, res) => {
    try {
        // getting the current date and date 7 days ago
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);

        // get all closed leads and sales agent name
        const closedLeads = await Lead.find({ status: "Closed" }).populate("salesAgent", "name");

        // filter leads that were closed between sevenDaysAgo and now
        const recentClosedLeads = closedLeads.filter(lead => {
            return lead.closedAt && lead.closedAt >= sevenDaysAgo && lead.closedAt <= now;
        });

        // count the number of leads closed by each sales agent
        const leadCountByAgent = {};
        recentClosedLeads.forEach(lead => {
            const agentName = lead.salesAgent?.name;
            if (!leadCountByAgent[agentName]) {
                leadCountByAgent[agentName] = 0;
            }
            leadCountByAgent[agentName]++;
        });

        // prepare the data in an array format for frontend charts
        const barData = Object.entries(leadCountByAgent).map(([agent, count]) => ({
            salesAgent: agent,
            closedLeads: count
        }));

        // send the final response
        res.status(200).json(barData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong. Please try again later." });
    }
});

//for get how many leads are in each status
app.get('/report/status-distribution', async (req,res)=>{
try {
  const leads = await Lead.find({}, { status: 1 });

  const statusCount = {};

  // count each status
  leads.forEach(lead => {
    const status = lead.status;
    if (statusCount[status]) {
      statusCount[status]++;
    } else {
      statusCount[status] = 1;
    }
  });

  // convert the object into an array
  const data = [];
  const statusList = Object.keys(statusCount); // just get the keys

  statusList.forEach(status => {
    data.push({
      label: status,
      value: statusCount[status]
    });
  });

  res.status(200).json(data);

}
  catch (error) {
        console.error(error); 
        res.status(500).json({ error: "Something went wrong. Please try again later." });
    }
})

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
