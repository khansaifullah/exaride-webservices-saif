const mongoose = require('mongoose');
const User = require('./user');
const Shift = require('./shift');
const Rider = require('./rider');
// Define our schema
var ShiftRequestSchema   = new mongoose.Schema({

    _riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider' },
    _shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
    _requestByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  
} , {timestamps: true});

// Export the Mongoose model
module.exports = mongoose.model('ShiftRequest', ShiftRequestSchema);