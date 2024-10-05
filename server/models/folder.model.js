import mongoose from "mongoose";

const { Schema } = mongoose;

const FolderSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
        default: "new_folder"
    },
    parentFolder: {
        type: Schema.Types.ObjectId,
        ref: "Folder",
        required: false,
    },
    documents: [
        {
            document: {
                name : { type: String, required: true },
                content: { type: String, required: true },
                isPublished: { type: Boolean, required: true, default: false }
            }
        }
    ],
});

let FolderItem = mongoose.model('Folders', FolderSchema);

export default FolderItem;