import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
});

let UserItem = mongoose.model('users', UserSchema);

export default UserItem;