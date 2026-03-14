import mongoose from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enums/index.js";

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, 'firstName is mandatory'],
            minLength: 2,
            maxLength: 25
        },
        lastName: {
            type: String,
            required: [true, 'lastName is mandatory'],
            minLength: 2,
            maxLength: 25
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: function () {
                return this.provider == ProviderEnum.System
            }
        },
        oldPasswords: [String],
        DOB: Date,
        gender: {
            type: Number,
            enum: Object.values(GenderEnum),
            default: GenderEnum.Male
        },
        provider: {
            type: Number,
            enum: Object.values(ProviderEnum),
            default: ProviderEnum.System
        },
        role: {
            type: Number,
            enum: Object.values(RoleEnum),
            default: RoleEnum.User
        },
        /*********************************************** */
        isTwoFactorEnabled: {
            type: Boolean,
            default: false
        },
        /***************************** */
        profilePicture: String,
        coverProfilePictures: [String],

        confirmEmail: Date,
        changeCredentialsTime: Date,


        phone: {
            type: String
        },
        otp: String,
        otpExpire: Date
    }, {
    collection: "Route_Users",
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

userSchema.virtual('username').set(function (value) {
    const [firstName, lastName] = value?.split(' ') || []
    this.set({ firstName, lastName });
}).get(function () {
    return this.firstName + " " + this.lastName;
})

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema)