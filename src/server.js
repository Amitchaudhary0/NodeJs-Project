import "dotenv/config";
import { connectDB } from "./db/index.js";
import { app } from "./app.js";



connectDB();

// ======================================================================================================
//                MongoDB Database Connect with efi (()=>{})() Immediately executable function
// ======================================================================================================
// (async () => {
//   try {
//     const databaseInstance = await mongoose.connect(
//       `${process.env.MONGODB_URI}`
//     );
//     console.log(
//       "MongoDb Database connected succesfully!!!",
//       databaseInstance?.connection?.host
//     );
//   } catch (error) {
//     console.log("There is an error while connecting with database: ", error);
//   }
// })();

app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is listning in: http://localhost:${process.env.PORT}/`);
}).on("error", error => console.log("Error in the Express app", error));

