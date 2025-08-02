
import User from "../models/User.js";
import Group from "../models/Group.js";
import Chat from "../models/Chat.js";

export const getUsers = async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } }).select("username _id");
  res.json(users);
};

export const getGroups = async (req, res) => {
  const groups = await Group.find({ members: req.user._id })
    .select("name _id members approvedBy")
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
  const { username } = req.body;
  const otherUser = await User.findOne({ username });

  if (!otherUser) return res.status(404).json({ msg: "User not found" });

  const existingGroup = await Group.findOne({
    members: { $all: [req.user._id, otherUser._id] },
    members: { $size: 2 }
  });

  if (existingGroup) return res.json({ msg: "Chat already exists", groupId: existingGroup._id });

  const group = await Group.create({
    name: `${req.user.username}-${otherUser.username}`,
    members: [req.user._id, otherUser._id],
    approvedBy: [req.user._id],
    createdBy: req.user._id
  });

  res.status(201).json({ group });
};

// Approve/Reject request
export const respondChatRequest = async (req, res) => {
  const { groupId, accept } = req.body;

  const group = await Group.findById(groupId);

  if (!group) return res.status(404).json({ msg: "Group not found" });

  if (!group.members.includes(req.user._id)) return res.status(403).json({ msg: "Unauthorized" });

  if (accept) {
    group.approvedBy.push(req.user._id);
    await group.save();
    res.json({ msg: "Accepted" });
  } else {
    group.members = group.members.filter((id) => id.toString() !== req.user._id.toString());
    group.approvedBy = group.approvedBy.filter((id) => id.toString() !== req.user._id.toString());
    await group.save();
    res.json({ msg: "Rejected" });
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
