const express = require("express");
const cors = require("cors");

const app = express();

const corsOptions = {
  origin: ["http://localhost:3000", "https://lead-flow-by-anvaya.vercel.app"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const { initializeDatabase } = require("./db/db.connect");

const Tag = require("./models/model.tags");
const Comment = require("./models/models.comments");
const Lead = require("./models/models.leads");
const SalesAgent = require("./models/models.saleAgents");

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
    console.error("Error fetching agents:", error.message);
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
    const { commentText, author } = req.body; // 👈 author is a string

    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const comment = new Comment({
      lead: leadId,
      author,
      commentText,
    });

    const savedComment = await comment.save();
    res.status(201).json(savedComment);
  } catch (error) {
    res.status(500).json({ error: "Error adding comment" });
  }
});

//for gets comments
app.get("/leads/:id/comments", async (req, res) => {
  try {
    const leadId = req.params.id;

    const comments = await Comment.find({ lead: leadId }).sort({
      createdAt: -1,
    });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: "Error getting comments" });
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
    const { status, salesAgent, priority, source } = req.query;

    const query = {};
    if (status) query.status = status;
    if (salesAgent) query.salesAgent = salesAgent;
    if (priority) query.priority = priority;
    if (source) query.source = source;

    const leads = await Lead.find(query).populate("salesAgent", "name");

    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ error: "Error getting leads." });
  }
});
// app.get("/leads", async (req, res) => {
//   try {
//     const leads = await Lead.find().populate("salesAgent", "name");
//     res.status(200).json(leads);
//   } catch (error) {
//     res.status(500).json({ error: "Error getting leads." });
//   }
// });

//for update lead by id
app.put("/leads/:id", async (req, res) => {
  try {
    const leadId = req.params.id;
    const updates = req.body;

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // ✅ If status is being changed to Closed
    if (updates.status === "Closed" && lead.status !== "Closed") {
      lead.closedAt = new Date();
    }

    // ✅ Prevent overwriting closedAt if already closed
    if (lead.status === "Closed" && updates.status !== "Closed") {
      delete updates.closedAt;
    }

    Object.assign(lead, updates);
    const savedLead = await lead.save();
    res.status(200).json(savedLead);
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: "Error updating lead." });
  }
});
// app.put("/leads/:id", async (req, res) => {
//   try {
//     const leadId = req.params.id;
//     const updates = req.body;

//     // Find the lead by ID
//     const lead = await Lead.findById(leadId);

//     if (!lead) {
//       return res.status(404).json({ error: "Lead not found" });
//     }

//     // ✅ If the lead is being marked Closed (and it wasn't closed before)
//     if (updates.status === "Closed" && lead.status !== "Closed") {
//       lead.closedAt = new Date(); // Set the closedAt timestamp
//     }

//     // ✅ If lead is already closed, prevent changing closedAt by mistake
//     if (lead.status === "Closed") {
//       delete updates.closedAt;
//     }

//     // Apply all other updates
//     Object.assign(lead, updates);

//     // Save the updated lead
//     const savedLead = await lead.save();

//     // Send the updated lead back
//     res.status(200).json(savedLead);
//   } catch (error) {
//     console.log("Error updating lead:", error);
//     res.status(500).json({ error: "Error updating lead." });
//   }
// });

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
      totalCloseLeads: closedLeads.length,
      totalLeadsInPipeline: activeLeads.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Something went wrong. Please try again later." });
  }
});

//for get closed leads from 7 days ago by sales agent

// app.get("/report/last-week", async (req, res) => {
//   try {
//     const now = new Date();
//     const sevenDaysAgo = new Date();
//     sevenDaysAgo.setDate(now.getDate() - 7);

//     const closedLeads = await Lead.find({ status: "Closed" }).populate(
//       "salesAgent",
//       "name"
//     );

//     const recentClosedLeads = closedLeads.filter((lead) => {
//       const closedTime = lead.closedAt || lead.updatedAt;
//       return closedTime >= sevenDaysAgo && closedTime <= now;
//     });

//     const leadCountByAgent = {};
//     recentClosedLeads.forEach((lead) => {
//       const agentName = lead.salesAgent?.name;
//       if (!agentName) return;

//       if (!leadCountByAgent[agentName]) {
//         leadCountByAgent[agentName] = 0;
//       }
//       leadCountByAgent[agentName]++;
//     });

//     const barData = Object.entries(leadCountByAgent).map(
//       ([agentName, count]) => {
//         return {
//           salesAgent: agentName,
//           closedLeads: count,
//         };
//       }
//     );

//     res.status(200).json(barData);
//   } catch (error) {
//     console.error("Error fetching last week's closed leads:", error);
//     res
//       .status(500)
//       .json({ error: "Something went wrong. Please try again later." });
//   }
// });

app.get("/report/last-week", async (req, res) => {
  try {
    // Get today's date and date 7 days ago
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Find all leads that are Closed and were closed in the last 7 days
    const closedLeads = await Lead.find({
      status: "Closed",
      closedAt: { $gte: sevenDaysAgo, $lte: today },
    }).populate("salesAgent", "name"); // Get the name of the sales agent

    // Create an object to count leads by sales agent
    const leadCount = {};

    // Go through each closed lead
    closedLeads.forEach((lead) => {
      const agentName = lead.salesAgent?.name;
      if (!agentName) return;

      // If this agent is already in the object, increase the count
      if (leadCount[agentName]) {
        leadCount[agentName]++;
      } else {
        // Otherwise, start the count at 1
        leadCount[agentName] = 1;
      }
    });

    // Convert the leadCount object into an array so we can send it as JSON
    const result = [];
    for (let agent in leadCount) {
      result.push({
        salesAgent: agent,
        closedLeads: leadCount[agent],
      });
    }

    // Send the final result
    res.status(200).json(result);
  } catch (error) {
    console.log("Error fetching last week's report:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

//for get how many leads are in each status
app.get("/report/status-distribution", async (req, res) => {
  try {
    const leads = await Lead.find({}, { status: 1 });

    const statusCount = {};

    // count each status
    leads.forEach((lead) => {
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

    statusList.forEach((status) => {
      data.push({
        label: status,
        value: statusCount[status],
      });
    });

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Something went wrong. Please try again later." });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
