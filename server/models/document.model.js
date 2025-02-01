import mongoose from "mongoose";

const { Schema } = mongoose;

const DocumentSchema = new Schema({
    title: {
        type: String,
        default: "Untitled"
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    parentDocument: {
        type: Schema.Types.ObjectId,
        ref: "documents",
        required: false
    },
    content: {
        type: String,
    },
    coverImage: {
        type: String,
        required: false,
    },
    icon: {
        type: String,
        required: false,
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    lastEditedBy: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    }
});

let DocumentItem = mongoose.model('documents', DocumentSchema);

export default DocumentItem;