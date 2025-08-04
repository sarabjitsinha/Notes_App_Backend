
import User from "../models/User.js";
import Group from "../models/Group.js";
import Chat from "../models/Chat.js";




export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("members", "username _id")
      .populate("approvedBy", "username _id")
      .populate("rejectedBy", "username _id")
      .populate("createdBy", "username _id");

    if (!group) {
      return res.status(404).json({ msg: "Group not found" });
    }

    res.json(group);
  } catch (err) {
    console.error("Error fetching group:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

export const getUsers = async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } }).select("username _id");
  
  res.json(users);
};

export const getGroups = async (req, res) => {
  
  const groups = await Group.find({ members: req.user._id })
  .select("name _id members approvedBy rejectedBy createdBy")
  .lean();
   
  const unread = await Chat.aggregate([
    { $match: { receiver: req.user._id, read: false, groupId: { $ne: null } } },
    { $group: { _id: "$groupId", count: { $sum: 1 } } }
  ]);

  const countMap = Object.fromEntries(unread.map((u) => [u._id.toString(), u.count]));

  res.json(
    groups.map((g) => ({
      ...g,
      unreadCount: countMap[g._id.toString()] || 0
    }))
  );
};

// Start chat (creates group if not exists)

export const startChat = async (req, res) => {
  const { usernames } = req.body; // array of usernames

  if (!Array.isArray(usernames) || usernames.length === 0) {
    return res.status(400).json({ msg: "Usernames array is required" });
  }

  // Get current user
  const currentUser = await User.findById(req.user._id);
  if (!currentUser) return res.status(401).json({ msg: "Unauthorized" });

  // Fetch other users
  const users = await User.find({ username: { $in: usernames } });

  if (users.length !== usernames.length) {
    return res.status(404).json({ msg: "One or more users not found" });
  }

  // Prepare members array (including current user)
  const memberIds = users.map((u) => u._id.toString());
  if (!memberIds.includes(req.user._id.toString())) {
    memberIds.push(req.user._id.toString());
  }

  // Check if such a group already exists
  const existingGroup = await Group.findOne({
    members: { $all: memberIds },
    $expr: { $eq: [{ $size: "$members" }, memberIds.length] },
  });

  if (existingGroup) {
    return res.status(200).json({ msg: "Group already exists", group: existingGroup });
  }

  // Create a group name (e.g., sorted usernames)
  const allUsernames = [...usernames, currentUser.username].sort().join("-");
  
  const group = await Group.create({
    name: allUsernames,
    members: memberIds,
    approvedBy: [req.user._id],
    createdBy: req.user._id,
  });

  res.status(201).json({ msg: "Group created", group });
};

// Approve/Reject request

export const respondChatRequest = async (req, res) => {
  const { groupId, accept } = req.body;

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ msg: "Group not found" });

  const userId = req.user._id.toString();
  const memberIds = group.members.map(id => id.toString());
  const creatorId = group.createdBy.toString();

  if (!memberIds.includes(userId)) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  if (accept) {
    if (!group.approvedBy.map(id => id.toString()).includes(userId)) {
      group.approvedBy.push(userId);
    }

    // Ensure user is not marked as rejected
    group.rejectedBy = (group.rejectedBy || []).filter(id => id.toString() !== userId);

    await group.save();
    return res.json({ msg: "Accepted" });

  } else {
    // Add to rejectedBy if not already present
    if (!group.rejectedBy.map(id => id.toString()).includes(userId)) {
      group.rejectedBy.push(userId);
    }

    // Do NOT delete immediately
    const remainingMembers = memberIds.filter(id => id !== creatorId);
    const allRejected = remainingMembers.every(id =>
      group.rejectedBy.map(r => r.toString()).includes(id)
    );

    if (allRejected) {
      await Group.findByIdAndDelete(groupId);
      return res.json({ msg: "Group deleted due to all rejections" });
    }

    await group.save();
    return res.json({ msg: "You have rejected this chat request" });
  }
};



// Fetch messages
export const getMessages = async (req, res) => {
  const { type, id } = req.params;

  if (type === "group") {
    const messages = await Chat.find({ groupId: id }).sort({ timestamp: 1 });
    res.json(messages);
  } else {
    const messages = await Chat.find({
      $or: [
        { sender: req.user._id, receiver: id },
        { sender: id, receiver: req.user._id }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  }
};
