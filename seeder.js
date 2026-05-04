import mongoose from "mongoose";
import dotenv from "dotenv";
import colors from "colors";

import connectDB from "./config/db.js";

import User from "./models/userModel.js";
import Lead from "./models/leadModel.js";
import users from "./data/users.js";

dotenv.config();
connectDB();

/* ---------------- LEADS ---------------- */
const sources = ["Facebook", "Google", "Referral", "Direct", "Instagram"];
const statuses = ["New", "Contacted", "Site Visit", "Negotiation", "Closed", "Lost"];
const locations = ["Panvel", "Kharghar", "Navi Mumbai", "Thane", "Mumbai"];
const propertyTypes = ["1 BHK", "2 BHK", "3 BHK", "Plot"];

const names = [
    "Amit Sharma",
    "Rohit Patil",
    "Sneha Iyer",
    "Vikram Rao",
    "Neha Kapoor",
    "Sahil Khan",
    "Pooja Mehta",
    "Arjun Deshmukh",
    "Karan Malhotra",
    "Divya Nair",
    "Riya Singh",
    "Nikhil Joshi",
    "Ananya Verma",
    "Harsh Patel",
    "Meera Iyer",
    "Aditya Roy",
    "Kavya Sharma",
    "Manish Gupta",
    "Simran Kaur",
    "Yash Desai",
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const leads = names.map((name, i) => ({
    name,
    phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    email: name.toLowerCase().replace(" ", "") + "@gmail.com",
    budget: Math.floor(Math.random() * 9000000 + 2000000),
    location: getRandom(locations),
    propertyType: getRandom(propertyTypes),
    source: getRandom(sources),
    status: getRandom(statuses),
}));

/* ---------------- SEED FUNCTION ---------------- */
const seedData = async () => {
    try {
        /* CLEAN DB */
        await User.deleteMany();
        await Lead.deleteMany();

        /* INSERT USERS */
        const createdUsers = await User.insertMany(users);

        const admin = createdUsers[0]._id;
        const agent1 = createdUsers[1]._id;
        const agent2 = createdUsers[2]._id;

        /* ASSIGN LEADS RANDOMLY */
        const assignedLeads = leads.map((lead, index) => {
            let assignedTo =
                index % 3 === 0 ? admin : index % 3 === 1 ? agent1 : agent2;

            return {
                ...lead,
                assignedTo,
                createdBy: admin,
                notes: [
                    {
                        text: "Lead created from seeder",
                        createdBy: admin,
                    },
                ],
            };
        });

        await Lead.insertMany(assignedLeads);

        console.log("🔥 CRM Seed Data Imported!".green.inverse);
        console.log(`Users: ${createdUsers.length}`.cyan);
        console.log(`Leads: ${assignedLeads.length}`.cyan);

        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

/* ---------------- RUN ---------------- */
seedData();