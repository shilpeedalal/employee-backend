const mongoose = require("mongoose");
// const {DATABASE, MONGODB_OPTIONS} = require('./config');
mongoose.set("strictQuery", false);

const DB = process.env.DATABASE;

// mongoose.connect(DB,{
//     useUnifiedTopology:true,
//     useNewUrlParser:true
// }).then(()=> console.log("DataBase Connected")).catch((err)=>{
//     console.log(err);
// })

exports.dbConnect = async () => {
	try {
	  if (
		mongoose.connections[0].readyState === 0 ||
		mongoose.connections[0].readyState === 3
	  ) {
		//@ts-ignore
		mongoConnect = await mongoose.connect(
			process.env.DATABASE,
			{
				useNewUrlParser: true,
				useUnifiedTopology: true,
			}
		);
		console.log(`mongo conn making: ${mongoose.connections[0].readyState}`);
		return 1;
	  } else {
		console.log(`mongo conn exists: ${mongoose.connections[0].readyState}`);
		return 1;
	  }
	} catch (e) {
	  console.log("mongoose monc error");
	  console.log(e);
	  throw Error("conn error");
	}
  };