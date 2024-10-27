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
        ref: "folders",
        required: false,
    },
    documents: [
        {
            type: Schema.Types.ObjectId,
            ref: "documents",
        }
    ],
});

let FolderItem = mongoose.model('folders', FolderSchema);

export default FolderItem;