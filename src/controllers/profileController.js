const User = require("../models/User");

exports.getUserDetails = async (req, res) => {
    try {
        const id = req.user.id;
        const userDetails = await User.findById(id).select("-password");
        res.status(200).json({ success: true, data: userDetails });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};