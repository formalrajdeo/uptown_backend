import mongoose from 'mongoose';

const activitySchema = mongoose.Schema(
    {
        lead: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lead',
            required: true,
        },
        type: {
            type: String,
            enum: ['CALL', 'NOTE', 'STATUS_CHANGE', 'ASSIGNED'],
        },
        message: {
            type: String,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

const LeadActivity = mongoose.model('LeadActivity', activitySchema);

export default LeadActivity;