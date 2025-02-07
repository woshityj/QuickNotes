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
    coverImage: {
        type: String,
        required: false
    },
    icon: {
        type: String,
        required: false
    },
    isPublic: {
        type: Boolean,
        default: true
    }
});

let TemplateItem = mongoose.model('templates', TemplateSchema);

export default TemplateItem;