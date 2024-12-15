import mongoose from "mongoose";

const { Schema } = mongoose;

const TemplateSchema = new Schema({
    title: {
        type: String,
        default: "Untitled"
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    content: {
        type: String
    },
    isPublic: {
        type: Boolean,
        default: true
    }
});

let TemplateItem = mongoose.model('templates', TemplateSchema);

export default TemplateItem;