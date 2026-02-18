const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    userId: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                if (this.role === 'student') {
                    return /^(23|24|25)(cs|ce|it)(?!000)[0-1][0-9]{2}$/.test(v);
                }
                if (this.role === 'mentor') {
                    return /^(csm|cem|itm)[0-9]{3}$/.test(v);
                }
                return true; // Admins or others
            },
            message: props => `${props.value} is not a valid ID format for this role!`
        }
    }, // The ID used for login
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        required: true, 
        enum: ['student', 'mentor','admin'] 
    }
});

userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    // Do NOT call next() here
});

// userSchema.pre('save', async function(next) { // Add next here
//     if (!this.isModified('password')) return next();
    
//     try {
//         const salt = await bcrypt.genSalt(10);
//         this.password = await bcrypt.hash(this.password, salt);
//         next(); // You MUST call next() to finish the save process
//     } catch (error) {
//         next(error);
//     }
// });
module.exports = mongoose.model('User', userSchema);
