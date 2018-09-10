const mongoose = require('mongoose');
const Shift = require('./shift');
const Rider = require('./rider');

// Define our schema
var DailyTripSchema   = new mongoose.Schema({

    
    _shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift'},
    _riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider'},
    isGoing: { type: Boolean, default: true },
    canceledByRider: { type: Boolean, default: false },
    pickUpTime: { type: Date, default: Date.now },
    dropOffTime: { type: Date, default: Date.now },

   
} , {timestamps: true});
// Export the Mongoose model
module.exports = mongoose.model('DailyTrip', DailyTripSchema);