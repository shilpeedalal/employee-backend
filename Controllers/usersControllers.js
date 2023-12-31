const users = require("../models/usersSchema");
const moment = require("moment");
const csv = require("fast-csv");
const fs = require("fs");
const {dbConnect} = require("../db/conn");
const BASE_URL = process.env.BASE_URL

// register user
exports.userpost = async (req, res) => {
    console.log("register user");
    const { fname, lname, email, mobile, gender, location, status } = req.body;
    const file = req.file ? req.file.filename : null;
    
    console.log("file",file);
    console.log("req.file.filename",req.file.filename);
    if (!fname || !lname || !email || !mobile || !gender || !location || !status || !file) {
        return res.status(401).json("All Inputs is required")
    }
    console.log("---error");
    try {
        dbConnect();
        const preuser = await users.findOne({ email: email });
        console.log("after db");
        if (preuser) {
            return res.status(401).json({error :"This user already exist in our databse"})
        } else {

            const datecreated = moment(new Date()).format("YYYY-MM-DD hh:mm:ss");

            const userData = new users({
                fname, lname, email, mobile, gender, location, status, profile: file, datecreated
            });
            await userData.save();
            return res.status(200).json(userData);
        }
    } catch (error) {
        console.log("catch block error", error)
        return res.status(401).json({error : "An error occurred while processing the request"});
    }
};


// usersget
exports.userget = async (req, res) => {
    
    const search = req.query.search || ""
    const gender = req.query.gender || ""
    const status = req.query.status || ""
    const sort = req.query.sort || ""
    const page = req.query.page || 1
    const ITEM_PER_PAGE = 4;
    
    
    const query = {
        fname: { $regex: search, $options: "i" }
    }
    
    if (gender && gender != "All") {
        query.gender = gender
    }
    
    if (status && status != "All") {
        query.status = status
    }
    
    try {
        
        dbConnect();
        const skip = (page - 1) * ITEM_PER_PAGE  // 1 * 4 = 4

        const count = await users.countDocuments(query);

        const usersdata = await users.find(query)
        .sort({ datecreated: sort == "new" ? -1 : 1 })
        .limit(ITEM_PER_PAGE)
        .skip(skip);
        console.log("query", query);

        const pageCount = Math.ceil(count/ITEM_PER_PAGE);  // 8 /4 = 2

        res.status(200).json({
            Pagination:{
                count,pageCount
            },
            usersdata
        })
        console.log("count",count)
        console.log(usersdata);
    } catch (error) {
        res.status(401).json(error)
    }
}

// single user get
exports.singleuserget = async (req, res) => {
    const { id } = req.params;
    
    try {
        dbConnect();
        const userdata = await users.findOne({ _id: id });
        res.status(200).json(userdata)
    } catch (error) {
        res.status(401).json(error)
    }
}

// user edit
exports.useredit = async (req, res) => {
    const { id } = req.params;
    const { fname, lname, email, mobile, gender, location, status, user_profile } = req.body;
    const file = req.file ? req.file.filename : user_profile
    
    const dateUpdated = moment(new Date()).format("YYYY-MM-DD hh:mm:ss");
    
    try {
        dbConnect();
        const updateuser = await users.findByIdAndUpdate({ _id: id }, {
            fname, lname, email, mobile, gender, location, status, profile: file, dateUpdated
        }, {
            new: true
        });

        await updateuser.save();
        res.status(200).json(updateuser);
    } catch (error) {
        res.status(401).json(error)
    }
}

// delete user
exports.userdelete = async (req, res) => {
    console.log("delete api");
    const { id } = req.params;
    try {
        dbConnect();
        const deletuser = await users.findByIdAndDelete({ _id: id });
        res.status(200).json(deletuser);
    } catch (error) {
        res.status(401).json(error)
    }
}

// chnage status
exports.userstatus = async (req, res) => {
    const { id } = req.params;
    const { data } = req.body;
    
    try {
        dbConnect();
        const userstatusupdate = await users.findByIdAndUpdate({ _id: id }, { status: data }, { new: true });
        res.status(200).json(userstatusupdate)
    } catch (error) {
        res.status(401).json(error)
    }
}

// export user
exports.userExport = async (req, res) => {
    try {
        dbConnect();
        const usersdata = await users.find();

        const csvStream = csv.format({ headers: true });

        if (!fs.existsSync("public/files/export/")) {
            if (!fs.existsSync("public/files")) {
                fs.mkdirSync("public/files/");
            }
            if (!fs.existsSync("public/files/export")) {
                fs.mkdirSync("./public/files/export/");
            }
        }

        const writablestream = fs.createWriteStream(
            "public/files/export/users.csv"
        );

        csvStream.pipe(writablestream);

        writablestream.on("finish", function () {
            res.json({
                downloadUrl: `${BASE_URL}/files/export/users.csv`,
            });
        });
        if (usersdata.length > 0) {
            usersdata.map((user) => {
                csvStream.write({
                    FirstName: user.fname ? user.fname : "-",
                    LastName: user.lname ? user.lname : "-",
                    Email: user.email ? user.email : "-",
                    Phone: user.mobile ? user.mobile : "-",
                    Gender: user.gender ? user.gender : "-",
                    Status: user.status ? user.status : "-",
                    Profile: user.profile ? user.profile : "-",
                    Location: user.location ? user.location : "-",
                    DateCreated: user.datecreated ? user.datecreated : "-",
                    DateUpdated: user.dateUpdated ? user.dateUpdated : "-",
                })
            })
        }
        csvStream.end();
        writablestream.end();

    } catch (error) {
        res.status(401).json(error)
    }
}

exports.test = async(req, res) => {
    try {
        console.log("db connection start");
        await dbConnect();
        console.log("db conn ends");

        res.status(200).json("Successully test execute");
    } catch (error) {
        console.log("error =>>>>>>", error);
        res.status(401).json("Error in test api");
    }
}